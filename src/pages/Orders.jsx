import { useEffect, useState } from 'react';
import api, { err } from '../api';
import { useApp } from '../store.jsx';
import { Stars, Empty, money, dt, code } from '../ui.jsx';

const FLOW = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];

function Track({ o }) {
  if (o.status === 'Cancelled') return <p className="bad">This order was cancelled.</p>;
  const idx = FLOW.indexOf(o.status);
  return (
    <ol className="track">{FLOW.map((s, i) => {
      const h = o.history.find((x) => x.status === s);
      return <li key={s} className={i <= idx ? 'done' : ''}><span />{s}<small>{h ? dt(h.at) : ''}</small></li>;
    })}</ol>
  );
}
function RateRow({ label, orderId, type, product, existing, onSaved }) {
  const { notify } = useApp();
  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!rating) return notify('Choose 1 to 5 stars', 'err');
    setBusy(true);
    try { await api.post('/reviews', { order: orderId, type, product, rating, comment }); notify('Thanks for your review'); onSaved(); }
    catch (e) { notify(err(e), 'err'); } finally { setBusy(false); }
  }
  return (
    <div className="rrow"><div><b>{label}</b><Stars value={rating} onChange={setRating} /></div>
      <input placeholder="Write a short comment (optional)" value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} />
      <button className="btn sm" disabled={busy} onClick={save}>{existing ? 'Update' : 'Submit'}</button></div>
  );
}

export default function Orders() {
  const { notify } = useApp();
  const [orders, setOrders] = useState(null);
  const [mine, setMine] = useState([]);
  const load = () => {
    api.get('/orders/mine').then((r) => setOrders(r.data)).catch((e) => notify(err(e), 'err'));
    api.get('/reviews/mine').then((r) => setMine(r.data)).catch(() => {});
  };
  useEffect(load, []);
  const find = (o, type, pid) => mine.find((r) => r.order === o._id && r.type === type && (type === 'service' || r.product === pid));
  async function cancel(id) {
    if (!confirm('Cancel this order?')) return;
    try { await api.put(`/orders/${id}/cancel`); notify('Order cancelled'); load(); } catch (e) { notify(err(e), 'err'); }
  }
  if (!orders) return <p className="muted center">Loading your orders…</p>;
  if (!orders.length) return <Empty title="No orders yet" hint="Your orders and their delivery status will show here." />;
  return (
    <>
      <h1>My orders</h1>
      {orders.map((o) => (
        <article className="card pad order" key={o._id}>
          <div className="row between wrap"><div><b>Order {code(o._id)}</b> <span className="muted">placed {dt(o.createdAt)}</span></div>
            <span className={'badge s-' + o.status}>{o.status}</span></div>
          <Track o={o} />
          <ul className="items">{o.items.map((i) => <li key={i._id}><span>{i.name} × {i.qty}</span><span>{money(i.price * i.qty)}</span></li>)}
            <li><span className="muted">Shipping</span><span>{money(o.shipping)}</span></li>
            <li className="total"><span>{o.paid ? 'Paid (cash on delivery)' : 'To pay on delivery'}</span><span>{money(o.total)}</span></li></ul>
          <p className="muted">Deliver to: {o.address.line}, {o.address.city} - {o.address.pincode}</p>
          {o.status === 'Placed' && <button className="btn ghost sm" onClick={() => cancel(o._id)}>Cancel order</button>}
          {o.status === 'Delivered' && (
            <div className="rate-box"><h3>Rate your order</h3>
              {o.items.map((i) => <RateRow key={i._id} label={`Quality of ${i.name}`} orderId={o._id} type="product" product={i.product} existing={find(o, 'product', i.product)} onSaved={load} />)}
              <RateRow label="Our service and delivery" orderId={o._id} type="service" existing={find(o, 'service')} onSaved={load} />
            </div>)}
        </article>
      ))}
    </>
  );
}
