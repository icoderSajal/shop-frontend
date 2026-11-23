import { Routes, Route, Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from './store.jsx';
import Store from './pages/Store.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';

function Nav() {
  const { user, logout, count } = useApp();
  const nav = useNavigate();
  return (
    <header className="nav">
      <Link to="/" className="brand"><span className="drop" />Sanitary Shop</Link>
      <nav>
        <NavLink to="/" end>Shop</NavLink>
        {user && user.role !== 'admin' && <NavLink to="/orders">My orders</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin panel</NavLink>}
        <NavLink to="/cart">Cart{count > 0 && <b className="pill">{count}</b>}</NavLink>
        {user ? <button className="link" onClick={() => { logout(); nav('/'); }}>Logout ({user.name.split(' ')[0]})</button> : <NavLink to="/login">Login</NavLink>}
      </nav>
    </header>
  );
}
const Guard = ({ admin, children }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};
export default function App() {
  const { toast } = useApp();
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Store />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/orders" element={<Guard><Orders /></Guard>} />
          <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="foot">Cash on delivery across the city. Questions about an order? Call the shop.</footer>
      {toast && <div className={'toast ' + toast.type} role="status">{toast.msg}</div>}
    </>
  );
}
