// Biểu đồ cột GPA theo học kỳ — 1 series duy nhất (GPA), nên dùng 1 màu accent,
// không cần chú giải (legend chỉ bắt buộc từ 2 series trở lên).
// viewBox nhỏ hơn để chữ không co quá nhỏ trên màn hẹp — text trong SVG scale theo
// viewBox, viewBox 1000+ khiến font 15-17 đơn vị chỉ còn ~5-6px thật trên mobile 375px.
const VB_W = 700;
const VB_H = 220;
const PAD_TOP = 24;
const PAD_BOTTOM = 40;
const PLOT_H = VB_H - PAD_TOP - PAD_BOTTOM;

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
  for (let v = 0; v <= maxScale; v += step) gridValues.push(v);

  const slotW = VB_W / ordered.length;
  const barW = Math.min(slotW * 0.46, 48);
  const baseline = PAD_TOP + PLOT_H;

  const valueToY = (v) => baseline - (v / maxScale) * PLOT_H;

  return (
    <>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="trend-chart"
        role="img"
        aria-label={`Biểu đồ GPA theo học kỳ, thang ${scale}`}
      >
        {gridValues.map((v) => (
          <g key={v}>
            <line
              x1={0}
              x2={VB_W}
              y1={valueToY(v)}
              y2={valueToY(v)}
              className={v === 0 ? 'chart-axis' : 'chart-grid'}
            />
            <text x={0} y={valueToY(v) - 6} className="chart-grid-label">
              {v}
            </text>
          </g>
        ))}

        {ordered.map((s, i) => {
          const cx = i * slotW + slotW / 2;
          const barH = Math.max((s.gpa / maxScale) * PLOT_H, s.gpa > 0 ? 3 : 0);
          const y = baseline - barH;
          const yearSuffix = s.academicYear ? ` · ${s.academicYear}` : '';
          return (
            <g key={`${s.semester}-${s.academicYear}`}>
              <rect
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                className="chart-bar"
              >
                <title>
                  {s.semester}
                  {yearSuffix}: GPA {s.gpa} ({s.classification})
                </title>
              </rect>
              <text x={cx} y={y - 8} className="chart-value-label">
                {s.gpa}
              </text>
              <text x={cx} y={baseline + 22} className="chart-axis-label">
                {s.semester}
              </text>
              {s.academicYear && (
                <text x={cx} y={baseline + 38} className="chart-axis-sublabel">
                  {s.academicYear}
                </text>
              )}
            </g>
          );
        })}
      </svg>

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
