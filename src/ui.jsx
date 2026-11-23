import { useState } from 'react';
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const dt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const code = (id) => '#' + String(id).slice(-6).toUpperCase();

export function Stars({ value = 0, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || Math.round(value);
  return (
    <span className="stars" role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} disabled={!onChange} style={{ fontSize: size }} className={n <= shown ? 'on' : ''}
          onClick={() => onChange && onChange(n)} onMouseEnter={() => onChange && setHover(n)} onMouseLeave={() => setHover(0)} aria-label={`${n} star`}>★</button>
      ))}
    </span>
  );
}
export const Img = ({ src, alt }) => (src ? <img src={src} alt={alt} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <div className="ph">No photo</div>);
export const Empty = ({ title, hint, children }) => <div className="empty"><h3>{title}</h3><p>{hint}</p>{children}</div>;

export function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal"><div className="modal-h"><h3>{title}</h3><button className="x" onClick={onClose} aria-label="Close">×</button></div>{children}</div>
    </div>
  );
}
// Generic form: fields = [{k, label, type, options, required, step, full}]
export function FormModal({ title, fields, initial = {}, submitText = 'Save', onSubmit, onClose, extra }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k, val) => setV((o) => ({ ...o, [k]: val }));
  async function go(e) { e.preventDefault(); setBusy(true); try { await onSubmit(v); } finally { setBusy(false); } }
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={go} className="grid2">
        {fields.map((f) => (
          <label key={f.k} className={f.full ? 'full' : ''}>{f.label}
            {f.type === 'select' ? (
              <select value={v[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} required={f.required}>
                <option value="">{f.placeholder || 'Select'}</option>{f.options.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea rows={3} value={v[f.k] ?? ''} onChange={(e) => set(f.k, e.target.value)} />
            ) : (
              <input type={f.type || 'text'} step={f.step} min={f.min} value={v[f.k] ?? ''} required={f.required} onChange={(e) => set(f.k, e.target.value)} />
            )}
          </label>
        ))}
        {extra && <div className="full">{extra(v)}</div>}
        <div className="full row end"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy}>{busy ? 'Saving…' : submitText}</button></div>
      </form>
    </Modal>
  );
}
