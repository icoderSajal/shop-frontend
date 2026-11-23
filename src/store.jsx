import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';
const Ctx = createContext();
export const useApp = () => useContext(Ctx);
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export function AppProvider({ children }) {
  const [user, setUser] = useState(read('user', null));
  const [cart, setCart] = useState(read('cart', []));
  const [toast, setToast] = useState(null);

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me').then((r) => { setUser(r.data); localStorage.setItem('user', JSON.stringify(r.data)); })
      .catch((e) => { if (e?.response?.status === 401) logout(); });
  }, []);

  function notify(msg, type = 'ok') { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }
  function login(data) { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); setUser(data.user); }
  function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); }
  function add(p, qty = 1) {
    if (p.stock < 1) return notify('This item is out of stock', 'err');
    setCart((c) => {
      const i = c.find((x) => x._id === p._id);
      if (i) return c.map((x) => (x._id === p._id ? { ...x, stock: p.stock, qty: Math.min(x.qty + qty, p.stock) } : x));
      return [...c, { _id: p._id, name: p.name, image: p.image, saleRate: p.saleRate, weight: p.weight, stock: p.stock, qty: Math.min(qty, p.stock) }];
    });
    notify('Added to cart');
  }
  const setQty = (id, q) => setCart((c) => c.map((x) => (x._id === id ? { ...x, qty: Math.max(1, Math.min(q, x.stock)) } : x)));
  const remove = (id) => setCart((c) => c.filter((x) => x._id !== id));
  const clear = () => setCart([]);
  const count = cart.reduce((s, x) => s + x.qty, 0);
  return <Ctx.Provider value={{ user, login, logout, cart, add, setQty, remove, clear, count, toast, notify }}>{children}</Ctx.Provider>;
}
