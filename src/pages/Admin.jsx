import { useEffect, useState, useCallback } from 'react';
import api, { err } from '../api';
import { useApp } from '../store.jsx';
import { FormModal, Stars, money, dt, code } from '../ui.jsx';

const TABS = ['Dashboard', 'Products', 'Vendors', 'Payments', 'Orders', 'Reviews'];
const NEXT = { Placed: ['Confirmed', 'Cancelled'], Confirmed: ['Shipped', 'Cancelled'], Shipped: ['Delivered', 'Cancelled'] };

function useLoad(url) {
  const { notify } = useApp();
  const [data, setData] = useState(null);
  const load = useCallback(() => api.get(url).then((r) => setData(r.data)).catch((e) => notify(err(e), 'err')), [url]);
  useEffect(() => { load(); }, [load]);
  return [data, load];
}
function useAct(reload) {
  const { notify } = useApp();
  return async (fn, ok) => { try { await fn(); notify(ok); reload && reload(); return true; } catch (e) { notify(err(e), 'err'); return false; } };
}

function Dashboard() {
  const [d] = useLoad('/admin/dashboard');
  if (!d) return <p className="muted">Loading…</p>;
  const cards = [['Product sales (delivered)', d.sales], ['Profit (delivered)', d.profit], ['Money in', d.moneyIn], ['Money out', d.moneyOut], ['Stock value (at cost)', d.stockValue], ['Owed to vendors', d.vendorDue]];
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return (
    <>
      <div className="stats">
        {cards.map(([t, v]) => <div className="card pad stat" key={t}><small className="muted">{t}</small><b>{money(v)}</b></div>)}
        <div className="card pad stat"><small className="muted">Orders in progress</small><b>{d.pending} of {d.orders}</b></div>
      </div>
      <div className="cols2">
        <div className="card pad"><h3>Low stock</h3>
          {d.lowStock.length === 0 ? <p className="muted">All products have enough stock.</p> :
            <table><thead><tr><th>Product</th><th>Left</th><th>Alert at</th></tr></thead><tbody>
              {d.lowStock.map((p) => <tr key={p._id}><td>{p.name}</td><td className={p.stock === 0 ? 'bad' : ''}><b>{p.stock}</b></td><td>{p.lowStockLimit}</td></tr>)}</tbody></table>}
        </div>
        <div className="card pad"><h3>Monthly sales report</h3>
          {d.monthly.length === 0 ? <p className="muted">Delivered orders will appear here.</p> :
            <table><thead><tr><th>Month</th><th>Orders</th><th>Sales</th><th>Profit</th></tr></thead><tbody>
              {d.monthly.map((m) => <tr key={m._id.y + '-' + m._id.m}><td>{M[m._id.m - 1]} {m._id.y}</td><td>{m.orders}</td><td>{money(m.sales)}</td><td className="ok">{money(m.profit)}</td></tr>)}</tbody></table>}
        </div>
      </div>
    </>
  );
}

function Products() {
  const [list, load] = useLoad('/admin/products');
  const [vendors] = useLoad('/admin/vendors');
  const [form, setForm] = useState(null); // {mode:'add'|'edit'|'stock', p}
  const act = useAct(load);
  const vopts = (vendors || []).map((v) => ({ v: v._id, t: v.name }));
  const margin = (v) => {
    const pr = Number(v.purchaseRate), sr = Number(v.saleRate);
    if (!pr && !sr) return null;
    const m = sr - pr;
    return <p className={m < 0 ? 'bad' : 'ok'}><b>Margin: {money(m)} per piece ({pr ? ((m / pr) * 100).toFixed(1) : 0}% on cost)</b></p>;
  };
  const base = [
    { k: 'name', label: 'Product name', required: true, full: true },
    { k: 'category', label: 'Category (e.g. CPVC Pipes, Taps)', required: true },
    { k: 'image', label: 'Photo link (URL)' },
    { k: 'purchaseRate', label: 'Purchase rate (₹)', type: 'number', step: '0.01', min: 0, required: true },
    { k: 'saleRate', label: 'Sale rate (₹)', type: 'number', step: '0.01', min: 0, required: true },
    { k: 'stock', label: 'Stock quantity', type: 'number', min: 0, required: true },
    { k: 'lowStockLimit', label: 'Alert when stock is at or below', type: 'number', min: 0 },
    { k: 'weight', label: 'Weight per piece (kg)', type: 'number', step: '0.01', min: 0 },
    { k: 'vendor', label: 'Vendor', type: 'select', options: vopts, placeholder: 'No vendor' },
    { k: 'description', label: 'Description', type: 'textarea', full: true },
  ];
  const addFields = [...base, { k: 'paid', label: 'Paid to vendor now (₹)', type: 'number', min: 0 }];
  async function del(p) { if (confirm(`Delete "${p.name}"? Past orders keep their details.`)) act(() => api.delete('/admin/products/' + p._id), 'Product deleted'); }
  return (
    <>
      <div className="row between"><h2>Products</h2><button className="btn" onClick={() => setForm({ mode: 'add', p: { stock: 0, lowStockLimit: 5, weight: 0.5 } })}>Add product</button></div>
      <div className="scroll"><table><thead><tr><th>Product</th><th>Stock</th><th>Purchase</th><th>Sale</th><th>Margin</th><th>Vendor</th><th></th></tr></thead><tbody>
        {(list || []).map((p) => (
          <tr key={p._id}><td><b>{p.name}</b><br /><small className="muted">{p.category}</small></td>
            <td className={p.stock <= p.lowStockLimit ? 'bad' : ''}><b>{p.stock}</b></td><td>{money(p.purchaseRate)}</td><td>{money(p.saleRate)}</td>
            <td className={p.margin < 0 ? 'bad' : 'ok'}>{money(p.margin)} ({p.marginPercent}%)</td><td>{p.vendor?.name || '-'}</td>
            <td className="nowrap"><button className="link" onClick={() => setForm({ mode: 'stock', p })}>Add stock</button> <button className="link" onClick={() => setForm({ mode: 'edit', p: { ...p, vendor: p.vendor?._id || '' } })}>Edit</button> <button className="link bad" onClick={() => del(p)}>Delete</button></td></tr>
        ))}
        {list && !list.length && <tr><td colSpan="7" className="muted">No products yet. Add your first product.</td></tr>}
      </tbody></table></div>
      {form?.mode === 'add' && <FormModal title="Add product" fields={addFields} initial={form.p} extra={margin} onClose={() => setForm(null)}
        onSubmit={async (v) => (await act(() => api.post('/admin/products', v), 'Product added')) && setForm(null)} />}
      {form?.mode === 'edit' && <FormModal title="Edit product" fields={base} initial={form.p} extra={margin} onClose={() => setForm(null)}
        onSubmit={async (v) => (await act(() => api.put('/admin/products/' + form.p._id, v), 'Product updated')) && setForm(null)} />}
      {form?.mode === 'stock' && <FormModal title={`Add stock: ${form.p.name}`} submitText="Add stock" initial={{ rate: form.p.purchaseRate, vendor: form.p.vendor?._id || '' }} onClose={() => setForm(null)}
        fields={[{ k: 'qty', label: 'Quantity bought', type: 'number', min: 1, required: true }, { k: 'rate', label: 'Purchase rate (₹)', type: 'number', step: '0.01', min: 0, required: true },
          { k: 'vendor', label: 'Vendor', type: 'select', options: vopts, placeholder: 'No vendor' }, { k: 'paid', label: 'Paid to vendor now (₹)', type: 'number', min: 0 }]}
        extra={(v) => <p className="muted">Sale rate stays {money(form.p.saleRate)}. New margin: {money(form.p.saleRate - Number(v.rate || 0))} per piece.</p>}
        onSubmit={async (v) => (await act(() => api.post(`/admin/products/${form.p._id}/restock`, v), 'Stock updated')) && setForm(null)} />}
    </>
  );
}

function Vendors() {
  const [list, load] = useLoad('/admin/vendors');
  const [form, setForm] = useState(null);
  const act = useAct(load);
  const fields = [{ k: 'name', label: 'Vendor name', required: true }, { k: 'phone', label: 'Phone' }, { k: 'address', label: 'Address', full: true }];
  return (
    <>
      <div className="row between"><h2>Vendors</h2><button className="btn" onClick={() => setForm({ mode: 'add', v: {} })}>Add vendor</button></div>
      <div className="scroll"><table><thead><tr><th>Vendor</th><th>Phone</th><th>Total purchase</th><th>Paid</th><th>You owe</th><th></th></tr></thead><tbody>
        {(list || []).map((v) => (
          <tr key={v._id}><td><b>{v.name}</b><br /><small className="muted">{v.address}</small></td><td>{v.phone || '-'}</td><td>{money(v.totalPurchase)}</td><td>{money(v.totalPaid)}</td>
            <td className={v.balance > 0 ? 'bad' : 'ok'}><b>{money(v.balance)}</b></td>
            <td className="nowrap"><button className="link" onClick={() => setForm({ mode: 'pay', v })}>Pay vendor</button> <button className="link" onClick={() => setForm({ mode: 'edit', v })}>Edit</button>
              <button className="link bad" onClick={() => confirm(`Delete ${v.name}?`) && act(() => api.delete('/admin/vendors/' + v._id), 'Vendor deleted')}>Delete</button></td></tr>
        ))}
        {list && !list.length && <tr><td colSpan="6" className="muted">No vendors yet.</td></tr>}
      </tbody></table></div>
      {form?.mode === 'add' && <FormModal title="Add vendor" fields={fields} onClose={() => setForm(null)} onSubmit={async (v) => (await act(() => api.post('/admin/vendors', v), 'Vendor added')) && setForm(null)} />}
      {form?.mode === 'edit' && <FormModal title="Edit vendor" fields={fields} initial={form.v} onClose={() => setForm(null)} onSubmit={async (v) => (await act(() => api.put('/admin/vendors/' + form.v._id, v), 'Vendor updated')) && setForm(null)} />}
      {form?.mode === 'pay' && <FormModal title={`Pay ${form.v.name}`} submitText="Record payment" initial={{ amount: form.v.balance > 0 ? form.v.balance : '', method: 'Cash' }} onClose={() => setForm(null)}
        fields={[{ k: 'amount', label: `Amount (₹). You owe ${money(form.v.balance)}`, type: 'number', step: '0.01', min: 0.01, required: true }, { k: 'method', label: 'Method', type: 'select', options: ['Cash', 'UPI', 'Bank transfer', 'Cheque'].map((m) => ({ v: m, t: m })) }, { k: 'note', label: 'Note', full: true }]}
        onSubmit={async (v) => (await act(() => api.post('/admin/payments', { ...v, type: 'out', vendor: form.v._id }), 'Payment recorded')) && setForm(null)} />}
    </>
  );
}

function Payments() {
  const [list, load] = useLoad('/admin/payments');
  const [vendors] = useLoad('/admin/vendors');
  const [open, setOpen] = useState(false);
  const act = useAct(load);
  const inn = (list || []).filter((p) => p.type === 'in').reduce((s, p) => s + p.amount, 0);
  const out = (list || []).filter((p) => p.type === 'out').reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <div className="row between"><h2>Payments in and out</h2><button className="btn" onClick={() => setOpen(true)}>Add entry</button></div>
      <div className="stats"><div className="card pad stat"><small className="muted">Money in (latest 200)</small><b className="ok">{money(inn)}</b></div><div className="card pad stat"><small className="muted">Money out</small><b className="bad">{money(out)}</b></div><div className="card pad stat"><small className="muted">Net</small><b>{money(inn - out)}</b></div></div>
      <div className="scroll"><table><thead><tr><th>Date</th><th>Type</th><th>Party</th><th>Method</th><th>Note</th><th>Amount</th></tr></thead><tbody>
        {(list || []).map((p) => <tr key={p._id}><td>{dt(p.createdAt)}</td><td><span className={'badge ' + (p.type === 'in' ? 's-Delivered' : 's-Cancelled')}>{p.type === 'in' ? 'In' : 'Out'}</span></td><td>{p.vendor?.name || p.party || '-'}</td><td>{p.method}</td><td>{p.note}</td><td className={p.type === 'in' ? 'ok' : 'bad'}><b>{money(p.amount)}</b></td></tr>)}
      </tbody></table></div>
      {open && <FormModal title="Add payment entry" initial={{ type: 'out', method: 'Cash' }} onClose={() => setOpen(false)}
        fields={[{ k: 'type', label: 'Type', type: 'select', required: true, options: [{ v: 'in', t: 'Money in (received)' }, { v: 'out', t: 'Money out (paid)' }] },
          { k: 'amount', label: 'Amount (₹)', type: 'number', step: '0.01', min: 0.01, required: true },
          { k: 'vendor', label: 'Vendor (if paying a vendor)', type: 'select', options: (vendors || []).map((v) => ({ v: v._id, t: v.name })), placeholder: 'Not a vendor' },
          { k: 'party', label: 'Party name (if not a vendor)' }, { k: 'method', label: 'Method', type: 'select', options: ['Cash', 'UPI', 'Bank transfer', 'Cheque'].map((m) => ({ v: m, t: m })) }, { k: 'note', label: 'Note' }]}
        onSubmit={async (v) => (await act(() => api.post('/admin/payments', v), 'Entry saved')) && setOpen(false)} />}
    </>
  );
}

function Orders() {
  const [list, load] = useLoad('/admin/orders');
  const act = useAct(load);
  return (
    <>
      <h2>Customer orders</h2>
      <div className="scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Update</th></tr></thead><tbody>
        {(list || []).map((o) => (
          <tr key={o._id}><td><b>{code(o._id)}</b><br /><small className="muted">{dt(o.createdAt)}</small></td>
            <td>{o.customer?.name}<br /><a href={'tel:' + o.customer?.phone}>{o.customer?.phone}</a><br /><small className="muted">{o.address.line}, {o.address.city} {o.address.pincode}</small></td>
            <td>{o.items.map((i) => <div key={i._id}>{i.name} × {i.qty}</div>)}<small className="muted">Shipping {money(o.shipping)}</small></td>
            <td><b>{money(o.total)}</b><br /><small className={o.paid ? 'ok' : 'muted'}>{o.paid ? 'Paid' : 'COD pending'}</small></td>
            <td><span className={'badge s-' + o.status}>{o.status}</span></td>
            <td>{NEXT[o.status] ? <select value="" onChange={(e) => e.target.value && act(() => api.put(`/admin/orders/${o._id}/status`, { status: e.target.value }), 'Order updated')}>
              <option value="">Change…</option>{NEXT[o.status].map((s) => <option key={s}>{s}</option>)}</select> : '-'}</td></tr>
        ))}
        {list && !list.length && <tr><td colSpan="6" className="muted">No orders yet.</td></tr>}
      </tbody></table></div>
    </>
  );
}

function Reviews() {
  const [list] = useLoad('/admin/reviews');
  return (
    <>
      <h2>Customer reviews</h2>
      <div className="scroll"><table><thead><tr><th>Date</th><th>Customer</th><th>About</th><th>Rating</th><th>Comment</th></tr></thead><tbody>
        {(list || []).map((r) => <tr key={r._id}><td>{dt(r.createdAt)}</td><td>{r.user?.name}</td><td>{r.type === 'service' ? 'Service' : r.product?.name || 'Product'}</td><td><Stars value={r.rating} size={15} /></td><td>{r.comment}</td></tr>)}
        {list && !list.length && <tr><td colSpan="5" className="muted">No reviews yet.</td></tr>}
      </tbody></table></div>
    </>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('Dashboard');
  const C = { Dashboard, Products, Vendors, Payments, Orders, Reviews }[tab];
  return (
    <>
      <h1>Admin panel</h1>
      <div className="tabs">{TABS.map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      <C key={tab} />
    </>
  );
}
