import { useState } from 'react';
import { register, login, setToken } from './api.js';
import BrandMark from './BrandMark.jsx';

function validate(email, password) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Email không hợp lệ';
  if (password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự';
  return errors;
}

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
    setFieldErrors({});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setBusy(true);
    setError('');
    try {
      const action = isRegister ? register : login;
      const data = await action(email.trim(), password);
      setToken(data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="auth-mark">
          <BrandMark size={22} />
        </span>
        <h1>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
        <p className="subtitle">
          {isRegister
            ? 'Đăng ký để lưu môn học và điểm của riêng bạn.'
            : 'Đăng nhập để xem môn học và GPA của bạn.'}
        </p>

        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="auth-fields">
          <label>
            EMAIL
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sinhvien@example.com"
              className={fieldErrors.email ? 'has-error' : ''}
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </label>
          <label>
            MẬT KHẨU
            <input
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className={fieldErrors.password ? 'has-error' : ''}
            />
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </label>
        </div>

        <button type="submit" className="block" disabled={busy}>
          {busy ? 'Đang xử lý…' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
        </button>

        <p className="auth-switch">
          {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <button type="button" className="link" onClick={switchMode}>
            {isRegister ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </p>
      </form>
    </div>
  );
}
