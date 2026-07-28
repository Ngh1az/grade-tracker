import { useState } from 'react';
import { register, login, setToken } from './api.js';
import BrandMark from './BrandMark.jsx';
import PasswordInput from './PasswordInput.jsx';

const EMPTY = { email: '', password: '', confirm: '' };

function validate(form, isRegister) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Email không hợp lệ';
  if (form.password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự';
  if (isRegister) {
    if (!form.confirm) errors.confirm = 'Nhập lại mật khẩu';
    else if (form.confirm !== form.password) errors.confirm = 'Mật khẩu nhập lại không khớp';
  }
  return errors;
}

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setForm({ ...EMPTY, email: form.email });
    setFieldErrors({});
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form, isRegister);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setBusy(true);
    setError('');
    try {
      const action = isRegister ? register : login;
      const data = await action(form.email.trim(), form.password);
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
      <div className="auth-brand">
        <BrandMark size={16} />
        Grade Tracker
      </div>

      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-card-head">
          <h1>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
          <p>
            {isRegister
              ? 'Nhập email và mật khẩu để bắt đầu theo dõi điểm.'
              : 'Nhập thông tin tài khoản để xem môn học và GPA.'}
          </p>
        </div>

        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            placeholder="sinhvien@example.com"
            className={fieldErrors.email ? 'has-error' : ''}
            aria-invalid={fieldErrors.email ? true : undefined}
          />
          {fieldErrors.email && (
            <span className="field-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="password">Mật khẩu</label>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={set('password')}
            placeholder={isRegister ? 'Tối thiểu 6 ký tự' : 'Mật khẩu của bạn'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password && (
            <span className="field-error" role="alert">
              {fieldErrors.password}
            </span>
          )}
        </div>

        {isRegister && (
          <div className="form-field">
            <label htmlFor="confirm">Nhập lại mật khẩu</label>
            <PasswordInput
              id="confirm"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              invalid={Boolean(fieldErrors.confirm)}
            />
            {fieldErrors.confirm && (
              <span className="field-error" role="alert">
                {fieldErrors.confirm}
              </span>
            )}
          </div>
        )}

        <button type="submit" className="block" disabled={busy}>
          {busy ? 'Đang xử lý…' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
        </button>

        <div className="auth-sep" role="separator">
          <span>hoặc</span>
        </div>

        <button type="button" className="secondary block" onClick={switchMode}>
          {isRegister ? 'Tôi đã có tài khoản' : 'Tạo tài khoản mới'}
        </button>
      </form>

      <p className="auth-foot">
        Mật khẩu được lưu dưới dạng băm bcrypt, không lưu bản gốc.
      </p>
    </div>
  );
}
