import { useState } from 'react';
import { setEducationLevel } from './api.js';
import LevelOptionCard from './LevelOptionCard.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const OPTIONS = [
  {
    value: 'pho-thong',
    title: 'Giáo dục phổ thông',
    detail: 'Điểm thang 10, không dùng tín chỉ.',
    lines: ['GPA = trung bình cộng điểm các môn', 'Xếp loại: Giỏi · Khá · Trung bình · Yếu · Kém'],
  },
  {
    value: 'dai-hoc',
    title: 'Giáo dục đại học',
    detail: 'Có tín chỉ, quy đổi sang thang 4.',
    lines: [
      'GPA thang 4 tính theo trọng số tín chỉ',
      'Điểm chữ A · B+ · B · C+ · C · D+ · D · F',
    ],
  },
];

export default function LevelPicker({ email, onPicked, onLogout }) {
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const data = await setEducationLevel(selected);
      onPicked(data.user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl border-border ring-0">
        <CardHeader>
          <CardTitle className="text-xl">Chọn bậc học</CardTitle>
          <CardDescription>
            Cách tính GPA và xếp loại khác nhau giữa hai bậc, nên cần chọn trước khi thêm môn.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Bậc học">
            {OPTIONS.map((opt) => (
              <LevelOptionCard
                key={opt.value}
                title={opt.title}
                detail={opt.detail}
                lines={opt.lines}
                selected={selected === opt.value}
                onClick={() => setSelected(opt.value)}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" onClick={confirm} disabled={!selected || busy}>
              {busy ? 'Đang lưu…' : 'Tiếp tục'}
            </Button>
            <Button type="button" variant="ghost" onClick={onLogout}>
              Đăng xuất {email ? `(${email})` : ''}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
