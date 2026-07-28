import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Ô mật khẩu có nút hiện/ẩn. Nút đặt type="button" để không submit form,
 * và có aria-label vì bản thân icon không mang nội dung đọc được.
 */
export default function PasswordInput({ id, value, onChange, placeholder, autoComplete, invalid }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        className="pr-9"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-0.5 top-0.5 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}
