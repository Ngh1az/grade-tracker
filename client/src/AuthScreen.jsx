import { useState } from 'react';
import { register, login, setToken } from './api.js';
import BrandMark from './BrandMark.jsx';
import PasswordInput from './PasswordInput.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <BrandMark size={16} />
        Grade Tracker
      </div>

      <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm">
        <Card className="border-border ring-0" size="sm">
          <CardHeader>
            <CardTitle className="text-xl">{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</CardTitle>
            <CardDescription>
              {isRegister
                ? 'Nhập email và mật khẩu để bắt đầu theo dõi điểm.'
                : 'Nhập thông tin tài khoản để xem môn học và GPA.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="sinhvien@example.com"
                aria-invalid={fieldErrors.email ? true : undefined}
              />
              {fieldErrors.email && (
                <span className="text-xs text-destructive" role="alert">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <PasswordInput
                id="password"
                value={form.password}
                onChange={set('password')}
                placeholder={isRegister ? 'Tối thiểu 6 ký tự' : 'Mật khẩu của bạn'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                invalid={Boolean(fieldErrors.password)}
              />
              {fieldErrors.password && (
                <span className="text-xs text-destructive" role="alert">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm">Nhập lại mật khẩu</Label>
                <PasswordInput
                  id="confirm"
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  invalid={Boolean(fieldErrors.confirm)}
                />
                {fieldErrors.confirm && (
                  <span className="text-xs text-destructive" role="alert">
                    {fieldErrors.confirm}
                  </span>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Đang xử lý…' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
            </Button>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Separator className="flex-1" />
              hoặc
              <Separator className="flex-1" />
            </div>

            <Button type="button" variant="secondary" className="w-full" onClick={switchMode}>
              {isRegister ? 'Tôi đã có tài khoản' : 'Tạo tài khoản mới'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
