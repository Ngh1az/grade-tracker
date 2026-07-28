/**
 * Nhãn của TỪNG MÔN (không phải xếp loại GPA): bậc đại học là điểm chữ,
 * bậc phổ thông là nhãn học lực. Liệt kê sẵn để giữ đúng thứ tự từ cao xuống thấp.
 */
const SUBJECT_LABELS = {
  'dai-hoc': ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'],
  'pho-thong': ['Giỏi', 'Khá', 'TB', 'Yếu', 'Kém'],
};

function gradeLevel(grade) {
  if (grade >= 7) return 'g-high';
  if (grade >= 5) return 'g-mid';
  return 'g-low';
}

export default function OverviewPanel({ data, level, loading, onGoSubjects }) {
  const usesCredits = level === 'dai-hoc';
  const { subjects, gpa, classification, semesters } = data;

  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const passed = subjects.filter((s) => s.grade >= 4).length;
  const best = subjects.reduce((top, s) => (top && top.grade >= s.grade ? top : s), null);

  // Đếm theo nhãn server đã tính cho từng môn, nên luôn khớp bậc đang chọn
  const distribution = (SUBJECT_LABELS[level] || [])
    .map((rank) => ({ rank, count: subjects.filter((s) => s.label === rank).length }))
    .filter((r) => r.count > 0);
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  if (loading) {
    return (
      <div className="panel">
        <div className="stats">
          {[0, 1, 2].map((i) => (
            <div className="stat" key={i}>
              <span className="skeleton" style={{ width: '40%' }} />
              <span className="skeleton" style={{ width: '60%', height: 28, marginTop: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h1>Tổng quan</h1>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-label">GPA</span>
          <span className="stat-value">{gpa}</span>
          <span className="stat-hint">{classification}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Số môn</span>
          <span className="stat-value">{subjects.length}</span>
          <span className="stat-hint">{passed} môn đạt từ 4.0 trở lên</span>
        </div>
        {usesCredits ? (
          <div className="stat">
            <span className="stat-label">Tín chỉ</span>
            <span className="stat-value">{totalCredits}</span>
            <span className="stat-hint">tổng đã tích luỹ</span>
          </div>
        ) : (
          <div className="stat">
            <span className="stat-label">Học kỳ</span>
            <span className="stat-value">{semesters.length}</span>
            <span className="stat-hint">đã có điểm</span>
          </div>
        )}
        <div className="stat">
          <span className="stat-label">Điểm cao nhất</span>
          <span className="stat-value">{best ? best.grade.toFixed(1) : '—'}</span>
          <span className="stat-hint">{best ? best.name : 'chưa có môn nào'}</span>
        </div>
      </div>

      {subjects.length === 0 ? (
        <section className="card">
          <div className="empty">
            <p>Chưa có môn học nào.</p>
            <p>Thêm môn đầu tiên để thấy GPA và xếp loại.</p>
            <button type="button" className="secondary" onClick={onGoSubjects} style={{ marginTop: 14 }}>
              Đi tới Môn học
            </button>
          </div>
        </section>
      ) : (
        <div className="grid-2">
          <section className="card">
            <div className="card-head">
              <h2>Môn gần đây</h2>
              <button type="button" className="ghost" onClick={onGoSubjects}>
                Xem tất cả
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>TÊN MÔN</th>
                    <th>ĐIỂM</th>
                    <th>HỌC KỲ</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.slice(0, 5).map((s) => (
                    <tr key={s._id}>
                      <td className="name">{s.name}</td>
                      <td>
                        <span className="grade">
                          <span className={`grade-dot ${gradeLevel(s.grade)}`} aria-hidden="true" />
                          <span className="grade-num">{s.grade.toFixed(1)}</span>
                          <span className="grade-letter">{s.label}</span>
                        </span>
                      </td>
                      <td className="sem">{s.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>{usesCredits ? 'Phân bố điểm chữ' : 'Phân bố học lực'}</h2>
            </div>
            <ul className="bars">
              {distribution.map(({ rank, count }) => (
                <li key={rank}>
                  <span className="bar-label">{rank}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </span>
                  <span className="bar-value">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
