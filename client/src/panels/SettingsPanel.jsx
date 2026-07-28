import { useState } from 'react';
import { setEducationLevel } from '../api.js';

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
        <div>
          <h1>Cài đặt</h1>
          <p className="subtitle">Tài khoản và cách tính điểm.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Tài khoản</h2>
        </div>
        <dl className="kv">
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Bậc học hiện tại</dt>
          <dd>{OPTIONS.find((o) => o.value === user.educationLevel)?.title}</dd>
        </dl>
        <div className="actions">
          <button type="button" className="secondary" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Đổi bậc học</h2>
        </div>
        <p className="subtitle" style={{ marginTop: 0, marginBottom: 16 }}>
          Đổi bậc sẽ tính lại GPA của toàn bộ môn đã có theo công thức của bậc mới. Môn học không bị
          xoá.
        </p>

        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
          </div>
        )}
        {saved && !changed && (
          <div className="alert is-success" role="status">
            <span>Đã lưu bậc học mới và tính lại GPA.</span>
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
              onClick={() => {
                setSelected(opt.value);
                setSaved(false);
              }}
            >
              <span className="level-option-head">
                <span className="radio" aria-hidden="true" />
                <span className="level-title">{opt.title}</span>
              </span>
              <span className="level-detail">{opt.detail}</span>
            </button>
          ))}
        </div>

        <div className="actions">
          <button type="button" onClick={save} disabled={!changed || busy}>
            {busy ? 'Đang lưu…' : 'Lưu bậc học'}
          </button>
        </div>
      </section>
    </div>
  );
}
