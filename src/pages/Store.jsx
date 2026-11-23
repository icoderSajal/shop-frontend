import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { err } from "../api";
import { useApp } from "../store.jsx";
import { Stars, Img, Empty, money } from "../ui.jsx";

export default function Store() {
  const { add, notify } = useApp();
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("newest");
  const [svc, setSvc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products/categories")
      .then((r) => setCats(r.data))
      .catch(() => {});
    api
      .get("/reviews/service")
      .then((r) => setSvc(r.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get("/products", { params: { q, category: cat, sort } })
        .then((r) => setProducts(r.data))
        .catch((e) => notify(err(e), "err"))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat, sort]);

  return (
    <>
      <section className="hero">
        <h1>Find the right pipe, fitting or tap.</h1>
        <p>
          PVC, CPVC and UPVC pipes, elbows, sockets, tees, wash basins, toilet
          seats and taps. Order online and pay when it arrives.
        </p>
        <input
          className="search"
          placeholder="Search, for example: 1 inch elbow, swan neck tap"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search products"
        />
        {svc && svc.count > 0 && (
          <div className="svc">
            <Stars value={svc.avg} size={18} /> <b>{svc.avg}</b> from{" "}
            {svc.count} customer service reviews
          </div>
        )}
      </section>

      <div className="bar">
        <div className="chips">
          {["All", ...cats].map((c) => (
            <button
              key={c}
              className={"chip" + (cat === c ? " on" : "")}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort"
        >
          <option value="newest">Newest</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {loading ? (
        <p className="muted center">Loading products…</p>
      ) : products.length === 0 ? (
        <Empty
          title="No products found"
          hint="Try a different word or choose All."
        />
      ) : (
        <div className="grid">
          {products.map((p) => (
            <article className="card pcard" key={p._id}>
              <Link to={`/product/${p._id}`} className="pimg">
                <Img src={p.image} alt={p.name} />
                {p.stock < 1 && <span className="tag">Out of stock</span>}
              </Link>
              <div className="pbody">
                <small className="muted">{p.category}</small>
                <Link to={`/product/${p._id}`}>
                  <h3>{p.name}</h3>
                </Link>
                <div className="rate">
                  {p.numReviews > 0 ? (
                    <>
                      <Stars value={p.avgRating} size={15} />{" "}
                      <small>({p.numReviews})</small>
                    </>
                  ) : (
                    <small className="muted">No reviews yet</small>
                  )}
                </div>
                <div className="row between">
                  <strong className="price">{money(p.saleRate)}</strong>
                  <button
                    className="btn sm"
                    disabled={p.stock < 1}
                    onClick={() => add(p)}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
