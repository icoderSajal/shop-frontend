import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { err } from '../api';
import { useApp } from '../store.jsx';
import { Img, Empty, money } from '../ui.jsx';

export default function Cart() {
  const { cart, setQty, remove, clear, user, notify } = useApp();
  const nav = useNavigate();
  const [zones, setZones] = useState({});
  const [zone, setZone] = useState('local');
  const [a, setA] = useState({ line: '', city: '', pincode: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get('/orders/zones').then((r) => setZones(r.data)).catch(() => {}); }, []);

  const items = cart.reduce((s, i) => s + i.saleRate * i.qty, 0);
  const weight = cart.reduce((s, i) => s + (i.weight || 0) * i.qty, 0);
  const z = zones[zone];
  const shipping = z ? Math.round(z.base + z.perKg * Math.ceil(weight)) : 0;

  async function place(e) {
    e.preventDefault();
    if (!user) return nav('/login');
    setBusy(true);
    try {
      await api.post('/orders', { items: cart.map((i) => ({ product: i._id, qty: i.qty })), address: a, zone });
      clear(); notify('Order placed. Pay cash on delivery.'); nav('/orders');
    } catch (x) { notify(err(x), 'err'); } finally { setBusy(false); }
  }
  if (!cart.length) return <Empty title="Your cart is empty" hint="Add pipes, fittings or taps to get started."><Link className="btn" to="/">Browse products</Link></Empty>;
  return (
    <div className="cols">
      <section>
        <h1>Your cart</h1>
        {cart.map((i) => (
          <div className="card row line" key={i._id}>
            <div className="thumb"><Img src={i.image} alt={i.name} /></div>
            <div className="grow"><b>{i.name}</b><div className="muted">{money(i.saleRate)} each</div></div>
            <div className="qty"><button onClick={() => setQty(i._id, i.qty - 1)}>−</button><span>{i.qty}</span><button onClick={() => setQty(i._id, i.qty + 1)}>+</button></div>
            <b className="w80">{money(i.saleRate * i.qty)}</b>
            <button className="link bad" onClick={() => remove(i._id)}>Remove</button>
          </div>
        ))}
      </section>
      <form className="card pad sticky" onSubmit={place}>
        <h2>Delivery and payment</h2>
        <label>Address<input required value={a.line} onChange={(e) => setA({ ...a, line: e.target.value })} placeholder="House no, street, area" /></label>
        <div className="grid2"><label>City<input required value={a.city} onChange={(e) => setA({ ...a, city: e.target.value })} /></label>
          <label>Pincode<input required inputMode="numeric" maxLength={6} value={a.pincode} onChange={(e) => setA({ ...a, pincode: e.target.value })} /></label></div>
        <label>How far is the delivery?<select value={zone} onChange={(e) => setZone(e.target.value)}>{Object.entries(zones).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        <div className="sum"><span>Items</span><span>{money(items)}</span></div>
        <div className="sum"><span>Shipping ({weight.toFixed(1)} kg)</span><span>{money(shipping)}</span></div>
        <div className="sum total"><span>Pay on delivery</span><span>{money(items + shipping)}</span></div>
        <button className="btn wide" disabled={busy}>{busy ? 'Placing order…' : user ? 'Place order (Cash on delivery)' : 'Log in to order'}</button>
      </form>
    </div>
  );
}
