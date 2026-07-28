import GpaTrendChart from './GpaTrendChart.jsx';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
  const { subjects, gpa, gpaScale, classification, semesters } = data;

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
            <Card className="border-border p-4 ring-0" key={i}>
              <Skeleton className="h-3 w-[40%]" />
              <Skeleton className="mt-3.5 h-7 w-[60%]" />
            </Card>
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
        <Card className="border-border p-4 ring-0">
          <span className="stat-label">GPA</span>
          <span className="stat-value">{gpa}</span>
          <span className="stat-hint">{classification}</span>
        </Card>
        <Card className="border-border p-4 ring-0">
          <span className="stat-label">Số môn</span>
          <span className="stat-value">{subjects.length}</span>
          <span className="stat-hint">{passed} môn đạt từ 4.0 trở lên</span>
        </Card>
        {usesCredits ? (
          <Card className="border-border p-4 ring-0">
            <span className="stat-label">Tín chỉ</span>
            <span className="stat-value">{totalCredits}</span>
            <span className="stat-hint">tổng đã tích luỹ</span>
          </Card>
        ) : (
          <Card className="border-border p-4 ring-0">
            <span className="stat-label">Học kỳ</span>
            <span className="stat-value">{semesters.length}</span>
            <span className="stat-hint">đã có điểm</span>
          </Card>
        )}
        <Card className="border-border p-4 ring-0">
          <span className="stat-label">Điểm cao nhất</span>
          <span className="stat-value">{best ? best.grade.toFixed(1) : '—'}</span>
          <span className="stat-hint">{best ? best.name : 'chưa có môn nào'}</span>
        </Card>
      </div>

      {subjects.length === 0 ? (
        <Card className="border-border ring-0">
          <CardContent>
            <div className="empty">
              <p>Chưa có môn học nào.</p>
              <p>Thêm môn đầu tiên để thấy GPA và xếp loại.</p>
              <Button type="button" variant="secondary" onClick={onGoSubjects} className="mt-3.5">
                Đi tới Môn học
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid-2">
          <Card className="border-border ring-0">
            <CardHeader>
              <CardTitle>Môn gần đây</CardTitle>
              <CardAction>
                <Button type="button" variant="ghost" size="sm" onClick={onGoSubjects}>
                  Xem tất cả
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TÊN MÔN</TableHead>
                    <TableHead>ĐIỂM</TableHead>
                    <TableHead>HỌC KỲ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.slice(0, 5).map((s) => (
                    <TableRow key={s._id}>
                      <TableCell className="name font-medium text-foreground">{s.name}</TableCell>
                      <TableCell>
                        <span className="grade">
                          <span className={`grade-dot ${gradeLevel(s.grade)}`} aria-hidden="true" />
                          <span className="grade-num">{s.grade.toFixed(1)}</span>
                          <span className="grade-letter">{s.label}</span>
                        </span>
                      </TableCell>
                      <TableCell className="sem">{s.semester}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border ring-0">
            <CardHeader>
              <CardTitle>{usesCredits ? 'Phân bố điểm chữ' : 'Phân bố học lực'}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
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
            </CardContent>
          </Card>
        </div>
      )}

      {semesters.length > 0 && (
        <Card className="chart-card border-border ring-0">
          <CardHeader>
            <CardTitle>GPA theo học kỳ</CardTitle>
          </CardHeader>
          <CardContent>
            <GpaTrendChart semesters={semesters} scale={gpaScale} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
