import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function SemestersPanel({ data, level, loading }) {
  const usesCredits = level === 'dai-hoc';
  const { semesters } = data;

  return (
    <div className="panel">
      <div className="panel-head">
        <h1>Học kỳ</h1>
      </div>

      <Card className="border-border ring-0">
        <CardHeader>
          <CardTitle>Theo học kỳ</CardTitle>
          {!loading && semesters.length > 0 && (
            <CardAction>
              <Badge variant="secondary">{semesters.length} kỳ</Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3" aria-live="polite" aria-busy="true">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-[92%]" />
            </div>
          ) : semesters.length === 0 ? (
            <div className="empty">
              <p>Chưa có học kỳ nào.</p>
              <p>Học kỳ được tạo tự động từ môn học bạn thêm.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HỌC KỲ</TableHead>
                  {usesCredits && <TableHead>NĂM HỌC</TableHead>}
                  <TableHead>SỐ MÔN</TableHead>
                  {usesCredits && <TableHead>TÍN CHỈ</TableHead>}
                  <TableHead>GPA</TableHead>
                  <TableHead>XẾP LOẠI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semesters.map((s) => (
                  <TableRow key={`${s.semester}-${s.academicYear}`}>
                    <TableCell className="name font-medium text-foreground">{s.semester}</TableCell>
                    {usesCredits && <TableCell className="sem">{s.academicYear || '—'}</TableCell>}
                    <TableCell className="num">{s.count}</TableCell>
                    {usesCredits && <TableCell className="num">{s.credits}</TableCell>}
                    <TableCell className="num grade-num">{s.gpa}</TableCell>
                    <TableCell className="sem">{s.classification}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
