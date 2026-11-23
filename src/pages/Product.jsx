import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { err } from '../api';
import { useApp } from '../store.jsx';
import { Stars, Img, money, dt } from '../ui.jsx';

export default function Product() {
  const { id } = useParams();
  const { add, notify } = useApp();
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  useEffect(() => {
    api.get('/products/' + id).then((r) => setP(r.data)).catch((e) => notify(err(e), 'err'));
    api.get('/reviews/product/' + id).then((r) => setReviews(r.data)).catch(() => {});
  }, [id]);
  if (!p) return <p className="muted center">Loading…</p>;
  return (
    <>
      <Link to="/" className="muted">← Back to shop</Link>
      <div className="detail">
        <div className="card dimg"><Img src={p.image} alt={p.name} /></div>
        <div>
          <small className="muted">{p.category}</small>
          <h1>{p.name}</h1>
          <div className="rate">{p.numReviews > 0 ? <><Stars value={p.avgRating} /> <b>{p.avgRating}</b> <small>({p.numReviews} reviews)</small></> : <small className="muted">No reviews yet</small>}</div>
          <p className="price big">{money(p.saleRate)}</p>
          <p>{p.description || 'Quality product from our shop.'}</p>
          <p className={p.stock > 0 ? 'ok' : 'bad'}>{p.stock > 0 ? (p.stock <= 5 ? `Only ${p.stock} left` : 'In stock') : 'Out of stock'}</p>
          {p.stock > 0 && (
            <div className="row">
              <div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(Math.min(p.stock, qty + 1))}>+</button></div>
              <button className="btn" onClick={() => add(p, qty)}>Add to cart</button>
            </div>
          )}
        </div>
      </div>
      <h2>Customer reviews</h2>
      {reviews.length === 0 ? <p className="muted">Reviews appear here after customers receive their orders.</p> :
        reviews.map((r) => <div className="card pad review" key={r._id}><Stars value={r.rating} size={16} /> <b>{r.user?.name || 'Customer'}</b> <small className="muted">{dt(r.createdAt)}</small>{r.comment && <p>{r.comment}</p>}</div>)}
    </>
  );
}
