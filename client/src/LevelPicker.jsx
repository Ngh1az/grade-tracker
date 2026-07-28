import { useState } from 'react';
import { setEducationLevel } from './api.js';

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
    <div className="auth-shell">
      <div className="level-card">
        <h1>Chọn bậc học</h1>
        <p className="subtitle">
          Cách tính GPA và xếp loại khác nhau giữa hai bậc, nên cần chọn trước khi thêm môn.
        </p>

        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="level-options" role="radiogroup" aria-label="Bậc học">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected === opt.value}
              className={`level-option${selected === opt.value ? ' is-selected' : ''}`}
              onClick={() => setSelected(opt.value)}
            >
              <span className="level-option-head">
                <span className="radio" aria-hidden="true" />
                <span className="level-title">{opt.title}</span>
              </span>
              <span className="level-detail">{opt.detail}</span>
              <span className="level-lines">
                {opt.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
            </button>
          ))}
        </div>

        <div className="actions">
          <button type="button" onClick={confirm} disabled={!selected || busy}>
            {busy ? 'Đang lưu…' : 'Tiếp tục'}
          </button>
          <button type="button" className="ghost" onClick={onLogout}>
            Đăng xuất {email ? `(${email})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
