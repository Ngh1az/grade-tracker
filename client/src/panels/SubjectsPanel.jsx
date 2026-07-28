import { useState } from 'react';
import { createSubject, updateSubject, deleteSubject } from '../api.js';

const EMPTY_FORM = { name: '', credits: '', grade: '', semester: '', academicYear: '' };
const YEAR_RE = /^\d{4}-\d{4}$/;

// Chỉ áp cho bậc đại học — phổ thông vẫn dùng 1 chuỗi tự do như trước (không có năm học riêng).
const SEMESTER_OPTIONS = [
  { value: 'HK1', label: 'Học kỳ 1 (HK1)' },
  { value: 'HK2', label: 'Học kỳ 2 (HK2)' },
  { value: 'HK3', label: 'Học kỳ hè (HK3)' },
];

/** Năm học hiện tại bắt đầu tháng 9; trước đó tính vào năm học của năm trước.
 * Trả 6 năm gần nhất + 1 năm tới, mới nhất lên đầu. */
function academicYearOptions() {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const years = [];
  for (let y = startYear + 1; y >= startYear - 5; y--) years.push(`${y}-${y + 1}`);
  return years;
}

function validate(form, usesCredits) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Nhập tên môn';
  if (usesCredits) {
    const credits = Number(form.credits);
    if (!form.credits || !Number.isFinite(credits) || credits < 1 || credits > 10)
      errors.credits = 'Tín chỉ từ 1 đến 10';
    if (!YEAR_RE.test(form.academicYear.trim())) errors.academicYear = 'Chọn năm học';
    if (!form.semester.trim()) errors.semester = 'Chọn học kỳ';
  } else if (!form.semester.trim()) {
    errors.semester = 'Nhập học kỳ';
  }
  const grade = Number(form.grade);
  if (form.grade === '' || !Number.isFinite(grade) || grade < 0 || grade > 10)
    errors.grade = 'Điểm từ 0 đến 10';
  return errors;
}

// Dot giới hạn 3 mức để không sinh thêm accent màu; điểm luôn nhập theo thang 10.
function gradeLevel(grade) {
  if (grade >= 7) return 'g-high';
  if (grade >= 5) return 'g-mid';
  return 'g-low';
}

export default function SubjectsPanel({ data, level, loading, reload }) {
  const usesCredits = level === 'dai-hoc';
  const { subjects } = data;

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form, usesCredits);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = {
      name: form.name.trim(),
      grade: Number(form.grade),
      semester: form.semester.trim(),
      ...(usesCredits
        ? { credits: Number(form.credits), academicYear: form.academicYear.trim() }
        : {}),
    };

    setSaving(true);
    setError('');
    try {
      if (editingId) await updateSubject(editingId, payload);
      else await createSubject(payload);
      resetForm();
      await reload();
    } catch (err) {
      setError(`Lưu thất bại: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(subject) {
    setEditingId(subject._id);
    setForm({
      name: subject.name,
      credits: String(subject.credits),
      grade: String(subject.grade),
      semester: subject.semester,
      academicYear: subject.academicYear || '',
    });
    setFormErrors({});
  }

  async function handleDelete(subject) {
    if (!window.confirm(`Xoá môn "${subject.name}"?`)) return;
    setError('');
    try {
      await deleteSubject(subject._id);
      if (editingId === subject._id) resetForm();
      await reload();
    } catch (err) {
      setError(`Xoá thất bại: ${err.message}`);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h1>Môn học</h1>
      </div>

      {error && (
        <div className="alert" role="alert">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="card-head">
          <h2>{editingId ? 'Sửa môn học' : 'Thêm môn học'}</h2>
          {editingId && <span className="status-badge">đang sửa</span>}
        </div>
        <div className={`fields${usesCredits ? '' : ' no-credits'}`}>
          <label>
            TÊN MÔN
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={usesCredits ? 'Lập trình Web' : 'Toán'}
              className={formErrors.name ? 'has-error' : ''}
            />
            {formErrors.name && <span className="field-error">{formErrors.name}</span>}
          </label>
          {usesCredits && (
            <label>
              TÍN CHỈ
              <input
                type="number"
                min="1"
                max="10"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
                placeholder="3"
                className={formErrors.credits ? 'has-error' : ''}
              />
              {formErrors.credits && <span className="field-error">{formErrors.credits}</span>}
            </label>
          )}
          <label>
            ĐIỂM (THANG 10)
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              placeholder="8.5"
              className={formErrors.grade ? 'has-error' : ''}
            />
            {formErrors.grade && <span className="field-error">{formErrors.grade}</span>}
          </label>
          <label>
            HỌC KỲ
            {usesCredits ? (
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className={formErrors.semester ? 'has-error' : ''}
              >
                <option value="" disabled>
                  -- Chọn học kỳ --
                </option>
                {SEMESTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                placeholder="HK1-2026"
                className={formErrors.semester ? 'has-error' : ''}
              />
            )}
            {formErrors.semester && <span className="field-error">{formErrors.semester}</span>}
          </label>
          {usesCredits && (
            <label>
              NĂM HỌC
              <select
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className={formErrors.academicYear ? 'has-error' : ''}
              >
                <option value="" disabled>
                  -- Chọn năm học --
                </option>
                {academicYearOptions().map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {formErrors.academicYear && (
                <span className="field-error">{formErrors.academicYear}</span>
              )}
            </label>
          )}
        </div>
        <div className="actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Đang lưu…' : editingId ? 'Cập nhật' : 'Thêm môn học'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="secondary">
              Huỷ
            </button>
          )}
        </div>
      </form>

      <section className="card">
        <div className="card-head">
          <h2>Danh sách môn học</h2>
          {!loading && subjects.length > 0 && (
            <span className="status-badge">{subjects.length} môn</span>
          )}
        </div>

        {loading ? (
          <div aria-live="polite" aria-busy="true">
            <span className="skeleton" style={{ width: '100%' }} />
            <span className="skeleton" style={{ width: '88%' }} />
            <span className="skeleton" style={{ width: '94%' }} />
            <span className="skeleton" style={{ width: '76%' }} />
          </div>
        ) : subjects.length === 0 ? (
          <div className="empty">
            <p>Chưa có môn học nào.</p>
            <p>Thêm môn đầu tiên bằng biểu mẫu ở trên.</p>
          </div>
        ) : usesCredits ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>TÊN MÔN</th>
                  <th>SỐ TÍN</th>
                  <th>ĐIỂM HỆ 10</th>
                  <th>ĐIỂM HỆ 4</th>
                  <th>ĐIỂM CHỮ</th>
                  <th>XẾP LOẠI</th>
                  <th>HỌC KỲ</th>
                  <th>NĂM HỌC</th>
                  <th aria-label="Hành động" />
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s._id} className={editingId === s._id ? 'is-editing' : ''}>
                    <td className="name">{s.name}</td>
                    <td className="num">{s.credits}</td>
                    <td className="num grade-num">{s.grade.toFixed(1)}</td>
                    <td className="num grade-num">{s.grade4.toFixed(1)}</td>
                    <td>
                      <span className="grade">
                        <span className={`grade-dot ${gradeLevel(s.grade)}`} aria-hidden="true" />
                        <span className="grade-letter">{s.letter}</span>
                      </span>
                    </td>
                    <td className="sem">{s.rank}</td>
                    <td className="sem">{s.semester}</td>
                    <td className="sem">{s.academicYear || '—'}</td>
                    <td className="row-actions">
                      <button type="button" className="ghost" onClick={() => handleEdit(s)}>
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="ghost destructive"
                        onClick={() => handleDelete(s)}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>TÊN MÔN</th>
                  <th>ĐIỂM</th>
                  <th>HỌC KỲ</th>
                  <th aria-label="Hành động" />
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s._id} className={editingId === s._id ? 'is-editing' : ''}>
                    <td className="name">{s.name}</td>
                    <td>
                      <span className="grade">
                        <span className={`grade-dot ${gradeLevel(s.grade)}`} aria-hidden="true" />
                        <span className="grade-num">{s.grade.toFixed(1)}</span>
                        <span className="grade-letter">{s.label}</span>
                      </span>
                    </td>
                    <td className="sem">{s.semester}</td>
                    <td className="row-actions">
                      <button type="button" className="ghost" onClick={() => handleEdit(s)}>
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="ghost destructive"
                        onClick={() => handleDelete(s)}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
