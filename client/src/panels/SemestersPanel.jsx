export default function SemestersPanel({ data, level, loading }) {
  const usesCredits = level === 'dai-hoc';
  const { semesters } = data;

  return (
    <div className="panel">
      <div className="panel-head">
        <h1>Học kỳ</h1>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Theo học kỳ</h2>
          {!loading && semesters.length > 0 && (
            <span className="status-badge">{semesters.length} kỳ</span>
          )}
        </div>

        {loading ? (
          <div aria-live="polite" aria-busy="true">
            <span className="skeleton" style={{ width: '100%' }} />
            <span className="skeleton" style={{ width: '85%' }} />
            <span className="skeleton" style={{ width: '92%' }} />
          </div>
        ) : semesters.length === 0 ? (
          <div className="empty">
            <p>Chưa có học kỳ nào.</p>
            <p>Học kỳ được tạo tự động từ môn học bạn thêm.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>HỌC KỲ</th>
                  {usesCredits && <th>NĂM HỌC</th>}
                  <th>SỐ MÔN</th>
                  {usesCredits && <th>TÍN CHỈ</th>}
                  <th>GPA</th>
                  <th>XẾP LOẠI</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map((s) => (
                  <tr key={`${s.semester}-${s.academicYear}`}>
                    <td className="name">{s.semester}</td>
                    {usesCredits && <td className="sem">{s.academicYear || '—'}</td>}
                    <td className="num">{s.count}</td>
                    {usesCredits && <td className="num">{s.credits}</td>}
                    <td className="num grade-num">{s.gpa}</td>
                    <td className="sem">{s.classification}</td>
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
