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

// Thang điểm 10 quy về xếp loại chữ để hiển thị badge màu
function gradeInfo(grade) {
  if (grade >= 8.5) return { cls: 'g-good', letter: 'A' };
  if (grade >= 7) return { cls: 'g-ok', letter: 'B' };
  if (grade >= 5.5) return { cls: 'g-mid', letter: 'C' };
  if (grade >= 4) return { cls: 'g-mid', letter: 'D' };
  return { cls: 'g-bad', letter: 'F' };
}

function classify(gpa) {
  if (gpa >= 9) return 'Xuất sắc';
  if (gpa >= 8) return 'Giỏi';
  if (gpa >= 7) return 'Khá';
  if (gpa >= 5.5) return 'Trung bình';
  if (gpa > 0) return 'Yếu';
  return '—';
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
    <div className="app">
      <header>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🎓
          </span>
          <div>
            <h1>Quản lý Môn học &amp; Điểm số</h1>
            <p className="subtitle">Theo dõi điểm từng môn và GPA trung bình theo tín chỉ</p>
          </div>
        </div>

        <div className="stats">
          <div className="stat is-hero">
            <span className="stat-label">GPA</span>
            <span className="stat-value">{gpa}</span>
            <span className="stat-hint">{classify(gpa)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Số môn</span>
            <span className="stat-value">{subjects.length}</span>
            <span className="stat-hint">{passed} môn đạt (≥ 4)</span>
          </div>
          <div className="stat">
            <span className="stat-label">Tổng tín chỉ</span>
            <span className="stat-value">{totalCredits}</span>
            <span className="stat-hint">đã tích luỹ</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={load}>
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
            Tên môn
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ví dụ: Lập trình Web"
              className={formErrors.name ? 'has-error' : ''}
            />
            {formErrors.name && <span className="field-error">{formErrors.name}</span>}
          </label>
          <label>
            Tín chỉ
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
            Điểm
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
            Học kỳ
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
            {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm môn học'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="secondary">
              Huỷ
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <div className="card-head">
          <h2>Danh sách môn học</h2>
          {!loading && subjects.length > 0 && (
            <span className="count-pill">{subjects.length} môn</span>
          )}
        </div>

        {loading ? (
          <div aria-live="polite" aria-busy="true">
            <span className="skeleton-row" style={{ width: '100%' }} />
            <span className="skeleton-row" style={{ width: '92%' }} />
            <span className="skeleton-row" style={{ width: '96%' }} />
            <span className="skeleton-row" style={{ width: '85%' }} />
          </div>
        ) : subjects.length === 0 ? (
          <div className="empty">
            <span className="empty-mark" aria-hidden="true">
              📚
            </span>
            <p>Chưa có môn học nào. Thêm môn đầu tiên ở trên.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên môn</th>
                  <th>Tín chỉ</th>
                  <th>Điểm</th>
                  <th>Học kỳ</th>
                  <th aria-label="Hành động" />
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => {
                  const g = gradeInfo(s.grade);
                  return (
                    <tr key={s._id} className={editingId === s._id ? 'is-editing' : ''}>
                      <td className="name">{s.name}</td>
                      <td className="num">{s.credits}</td>
                      <td>
                        <span className={`grade-badge ${g.cls}`}>
                          {s.grade}
                          <small>{g.letter}</small>
                        </span>
                      </td>
                      <td className="sem">{s.semester}</td>
                      <td className="row-actions">
                        <button type="button" onClick={() => handleEdit(s)} className="secondary">
                          Sửa
                        </button>
                        <button type="button" onClick={() => handleDelete(s)} className="danger">
                          Xoá
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
