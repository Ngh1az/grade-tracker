import { useState } from 'react';
import { setEducationLevel } from '../api.js';
import LevelOptionCard from '../LevelOptionCard.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const OPTIONS = [
  {
    value: 'pho-thong',
    title: 'Giáo dục phổ thông',
    detail: 'Điểm thang 10, không dùng tín chỉ.',
  },
  {
    value: 'dai-hoc',
    title: 'Giáo dục đại học',
    detail: 'Có tín chỉ, quy đổi sang thang 4.',
  },
];

export default function SettingsPanel({ user, onUserChange, onLogout, reload }) {
  const [selected, setSelected] = useState(user.educationLevel);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const changed = selected !== user.educationLevel;

  async function save() {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const data = await setEducationLevel(selected);
      onUserChange(data.user);
      await reload();
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h1>Cài đặt</h1>
      </div>

      <Card className="mb-3 border-border ring-0">
        <CardHeader>
          <CardTitle>Tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email}</dd>
            <dt className="text-muted-foreground">Bậc học hiện tại</dt>
            <dd>{OPTIONS.find((o) => o.value === user.educationLevel)?.title}</dd>
          </dl>
          <div>
            <Button type="button" variant="secondary" onClick={onLogout}>
              Đăng xuất
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border ring-0">
        <CardHeader>
          <CardTitle>Đổi bậc học</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Đổi bậc sẽ tính lại GPA của toàn bộ môn đã có theo công thức của bậc mới. Môn học
            không bị xoá.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {saved && !changed && (
            <Alert>
              <AlertDescription>Đã lưu bậc học mới và tính lại GPA.</AlertDescription>
            </Alert>
          )}

          <div className="level-options" role="radiogroup" aria-label="Bậc học">
            {OPTIONS.map((opt) => (
              <LevelOptionCard
                key={opt.value}
                title={opt.title}
                detail={opt.detail}
                selected={selected === opt.value}
                onClick={() => {
                  setSelected(opt.value);
                  setSaved(false);
                }}
              />
            ))}
          </div>

          <div>
            <Button type="button" onClick={save} disabled={!changed || busy}>
              {busy ? 'Đang lưu…' : 'Lưu bậc học'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
