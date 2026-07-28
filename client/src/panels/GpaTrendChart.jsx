// Biểu đồ cột GPA theo học kỳ — HTML/CSS thuần (không SVG viewBox), vì text trong SVG
// co theo tỉ lệ scale của viewBox: cùng 1 font-size khai báo sẽ hiện ~6-7px thật trên
// điện thoại nhưng ~15px trên desktop, không cách nào giữ cùng kích thước chữ đọc được
// cho mọi bề rộng màn hình chỉ bằng CSS viewBox. Bar cao theo %, chữ giữ nguyên px thật.
// Chiều cao lấy từ CSS (.trend-chart height: clamp(...)) để tự co giãn theo viewport.

function niceStep(maxScale) {
  return maxScale > 5 ? 2 : 1;
}

export default function GpaTrendChart({ semesters, scale }) {
  if (!semesters || semesters.length === 0) return null;

  // Server trả mới nhất trước; biểu đồ xu hướng đọc trái→phải là cũ→mới.
  const ordered = [...semesters].reverse();
  const maxScale = Math.ceil(scale);
  const step = niceStep(maxScale);
  const gridValues = [];
  for (let v = maxScale; v >= 0; v -= step) gridValues.push(v);

  return (
    <>
      <div
        className="trend-chart"
        role="img"
        aria-label={`Biểu đồ GPA theo học kỳ, thang ${scale}`}
      >
        <div className="trend-grid">
          {gridValues.map((v) => (
            <div key={v} className="trend-grid-row" style={{ top: `${100 - (v / maxScale) * 100}%` }}>
              <span className="chart-grid-label">{v}</span>
              <span className={v === 0 ? 'chart-axis-line' : 'chart-grid-line'} />
            </div>
          ))}
        </div>
        <div className="trend-bars">
          {ordered.map((s) => {
            const yearSuffix = s.academicYear ? ` · ${s.academicYear}` : '';
            const heightPct = Math.max((s.gpa / maxScale) * 100, s.gpa > 0 ? 1.5 : 0);
            return (
              <div key={`${s.semester}-${s.academicYear}`} className="trend-col">
                <div className="trend-bar-track">
                  <span className="chart-value-label">{s.gpa}</span>
                  <span
                    className="trend-bar"
                    style={{ height: `${heightPct}%` }}
                    title={`${s.semester}${yearSuffix}: GPA ${s.gpa} (${s.classification})`}
                  />
                </div>
                <span className="chart-axis-label">{s.semester}</span>
                {s.academicYear && <span className="chart-axis-sublabel">{s.academicYear}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <table className="sr-only">
        <caption>GPA theo học kỳ</caption>
        <thead>
          <tr>
            <th>Học kỳ</th>
            <th>Năm học</th>
            <th>GPA</th>
            <th>Xếp loại</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((s) => (
            <tr key={`${s.semester}-${s.academicYear}-row`}>
              <td>{s.semester}</td>
              <td>{s.academicYear || '—'}</td>
              <td>{s.gpa}</td>
              <td>{s.classification}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
