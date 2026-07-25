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

  return (
    <div className="app">
      <header>
        <h1>Quản lý Môn học &amp; Điểm số</h1>
        <div className="gpa">
          GPA (trung bình theo tín chỉ): <strong>{gpa}</strong>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          {error}
          <button type="button" onClick={load}>
            Thử lại
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <h2>{editingId ? 'Sửa môn học' : 'Thêm môn học'}</h2>
        <div className="fields">
          <label>
            Tên môn
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ví dụ: Lập trình Web"
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
            />
            {formErrors.grade && <span className="field-error">{formErrors.grade}</span>}
          </label>
          <label>
            Học kỳ
            <input
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              placeholder="HK1-2026"
            />
            {formErrors.semester && <span className="field-error">{formErrors.semester}</span>}
          </label>
        </div>
        <div className="actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="secondary">
              Huỷ
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h2>Danh sách môn học ({subjects.length})</h2>
        {loading ? (
          <p className="muted">Đang tải...</p>
        ) : subjects.length === 0 ? (
          <p className="muted">Chưa có môn học nào. Thêm môn đầu tiên ở trên.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tên môn</th>
                <th>Tín chỉ</th>
                <th>Điểm</th>
                <th>Học kỳ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.credits}</td>
                  <td>{s.grade}</td>
                  <td>{s.semester}</td>
                  <td className="row-actions">
                    <button type="button" onClick={() => handleEdit(s)} className="secondary">
                      Sửa
                    </button>
                    <button type="button" onClick={() => handleDelete(s)} className="danger">
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
