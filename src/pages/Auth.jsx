import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { err } from '../api';
import { useApp } from '../store.jsx';

export default function Auth({ mode }) {
  const reg = mode === 'register';
  const { login, notify } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await api.post(reg ? '/auth/register' : '/auth/login', f);
      login(data); notify(reg ? 'Account created' : 'Welcome back');
      nav(data.user.role === 'admin' ? '/admin' : '/');
    } catch (x) { notify(err(x), 'err'); } finally { setBusy(false); }
  }
  return (
    <div className="auth">
      <form className="card pad" onSubmit={submit}>
        <h1>{reg ? 'Create your account' : 'Log in'}</h1>
        <p className="muted">{reg ? 'We send order updates to your mobile number.' : 'Log in to place and track orders.'}</p>
        {reg && <label>Full name<input required value={f.name} onChange={set('name')} autoComplete="name" /></label>}
        <label>Email<input required type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
        {reg && <label>Mobile number<input required inputMode="numeric" maxLength={10} placeholder="10 digits" value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>}
        <label>Password<input required type="password" minLength={6} value={f.password} onChange={set('password')} autoComplete={reg ? 'new-password' : 'current-password'} /></label>
        <button className="btn wide" disabled={busy}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}</button>
        <p className="muted center">{reg ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New customer? <Link to="/register">Create an account</Link></>}</p>
      </form>
    </div>
  );
}
