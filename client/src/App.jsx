import { useEffect, useState } from 'react';
import { listSubjects, createSubject, updateSubject, deleteSubject } from './api.js';

const EMPTY_FORM = { name: '', credits: '', grade: '', semester: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Nhập tên môn';
  const credits = Number(form.credits);
  if (!form.credits || !Number.isFinite(credits) || credits < 1 || credits > 10)
    errors.credits = 'Tín chỉ từ 1 đến 10';
  const grade = Number(form.grade);
  if (form.grade === '' || !Number.isFinite(grade) || grade < 0 || grade > 10)
    errors.grade = 'Điểm từ 0 đến 10';
  if (!form.semester.trim()) errors.semester = 'Nhập học kỳ';
  return errors;
}

// Dot chỉ 3 mức để giữ đúng nguyên tắc "không thêm accent màu thứ hai" của Linear;
// điểm chữ đi kèm ở tông chữ mờ, không tô nền màu.
function gradeLevel(grade) {
  if (grade >= 7) return 'g-high';
  if (grade >= 5) return 'g-mid';
  return 'g-low';
}

function gradeLetter(grade) {
  if (grade >= 8.5) return 'A';
  if (grade >= 7) return 'B';
  if (grade >= 5.5) return 'C';
  if (grade >= 4) return 'D';
  return 'F';
}

function classify(gpa) {
  if (gpa >= 9) return 'Xuất sắc';
  if (gpa >= 8) return 'Giỏi';
  if (gpa >= 7) return 'Khá';
  if (gpa >= 5.5) return 'Trung bình';
  if (gpa > 0) return 'Yếu';
  return 'Chưa có dữ liệu';
}

function BrandMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="14" height="14" rx="3.5" stroke="currentColor" />
      <path d="M4 8.6V5.2L7.5 3.5L11 5.2V8.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 8.2V11.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [gpa, setGpa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await listSubjects();
      setSubjects(data.subjects);
      setGpa(data.gpa);
    } catch (err) {
      setError(`Không tải được dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = {
      name: form.name.trim(),
      credits: Number(form.credits),
      grade: Number(form.grade),
      semester: form.semester.trim(),
    };

    setSaving(true);
    setError('');
    try {
      if (editingId) await updateSubject(editingId, payload);
      else await createSubject(payload);
      resetForm();
      await load();
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
    });
    setFormErrors({});
  }

  async function handleDelete(subject) {
    if (!window.confirm(`Xoá môn "${subject.name}"?`)) return;
    setError('');
    try {
      await deleteSubject(subject._id);
      if (editingId === subject._id) resetForm();
      await load();
    } catch (err) {
      setError(`Xoá thất bại: ${err.message}`);
    }
  }

  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const passed = subjects.filter((s) => s.grade >= 4).length;

  return (
    <>
      <nav className="top-nav">
        <span className="wordmark">
          <BrandMark />
          Grade Tracker
        </span>
        <span className="nav-meta">nghiatech.click</span>
      </nav>

      <div className="app">
        <header className="page-head">
          <h1>Môn học &amp; Điểm số</h1>
          <p className="subtitle">Theo dõi điểm từng môn và GPA trung bình theo tín chỉ.</p>
        </header>

        <div className="stats">
          <div className="stat">
            <span className="stat-label">GPA</span>
            <span className="stat-value">{gpa}</span>
            <span className="stat-hint">{classify(gpa)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Số môn</span>
            <span className="stat-value">{subjects.length}</span>
            <span className="stat-hint">{passed} môn đạt từ 4.0 trở lên</span>
          </div>
          <div className="stat">
            <span className="stat-label">Tín chỉ</span>
            <span className="stat-value">{totalCredits}</span>
            <span className="stat-hint">tổng đã tích luỹ</span>
          </div>
        </div>

        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
            <button type="button" className="secondary" onClick={load}>
              Thử lại
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          <div className="card-head">
            <h2>{editingId ? 'Sửa môn học' : 'Thêm môn học'}</h2>
          </div>
          <div className="fields">
            <label>
              TÊN MÔN
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Lập trình Web"
                className={formErrors.name ? 'has-error' : ''}
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </label>
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
            <label>
              ĐIỂM
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
              <input
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                placeholder="HK1-2026"
                className={formErrors.semester ? 'has-error' : ''}
              />
              {formErrors.semester && <span className="field-error">{formErrors.semester}</span>}
            </label>
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
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>TÊN MÔN</th>
                    <th>TÍN CHỈ</th>
                    <th>ĐIỂM</th>
                    <th>HỌC KỲ</th>
                    <th aria-label="Hành động" />
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr key={s._id} className={editingId === s._id ? 'is-editing' : ''}>
                      <td className="name">{s.name}</td>
                      <td className="num">{s.credits}</td>
                      <td>
                        <span className="grade">
                          <span className={`grade-dot ${gradeLevel(s.grade)}`} aria-hidden="true" />
                          <span className="grade-num">{s.grade.toFixed(1)}</span>
                          <span className="grade-letter">{gradeLetter(s.grade)}</span>
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
    </>
  );
}
