import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { createSubject, updateSubject, deleteSubject } from '../api.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EMPTY_FORM = { name: '', credits: '', grade: '', semester: '', academicYear: '' };
const YEAR_RE = /^\d{4}$/;

// Chỉ áp cho bậc đại học — phổ thông vẫn dùng 1 chuỗi tự do như trước (không có năm học riêng).
const SEMESTER_OPTIONS = [
  { value: 'HK1', label: 'Học kỳ 1 (HK1)' },
  { value: 'HK2', label: 'Học kỳ 2 (HK2)' },
  { value: 'HK3', label: 'Học kỳ hè (HK3)' },
];

/** Năm học ghi 1 số duy nhất (năm bắt đầu, ví dụ "2025" cho niên khoá 2025-2026) —
 * đỡ rối hơn ghi cả cặp. Năm học hiện tại bắt đầu tháng 9; trước đó tính vào năm trước.
 * Trả 6 năm gần nhất + 1 năm tới, mới nhất lên đầu. */
function academicYearOptions() {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const years = [];
  for (let y = startYear + 1; y >= startYear - 5; y--) years.push(String(y));
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

const ALL = '__all__';
const PAGE_SIZE = 10;

function sortIcon(active, dir) {
  if (!active) return <ArrowUpDown className="size-3.5 opacity-40" />;
  return dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
}

export default function SubjectsPanel({ data, level, loading, reload }) {
  const usesCredits = level === 'dai-hoc';
  const { subjects } = data;

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState(ALL);
  const [yearFilter, setYearFilter] = useState(ALL);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const semesterChoices = useMemo(
    () => [...new Set(subjects.map((s) => s.semester).filter(Boolean))].sort(),
    [subjects],
  );
  const yearChoices = useMemo(
    () => [...new Set(subjects.map((s) => s.academicYear).filter(Boolean))].sort(),
    [subjects],
  );

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const visibleSubjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = subjects.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (semesterFilter !== ALL && s.semester !== semesterFilter) return false;
      if (usesCredits && yearFilter !== ALL && s.academicYear !== yearFilter) return false;
      return true;
    });
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''), 'vi');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [subjects, search, semesterFilter, yearFilter, usesCredits, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [search, semesterFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(visibleSubjects.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedSubjects = visibleSubjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

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
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-3 border-border ring-0">
          <CardHeader>
            <CardTitle>{editingId ? 'Sửa môn học' : 'Thêm môn học'}</CardTitle>
            {editingId && (
              <CardAction>
                <Badge variant="secondary">đang sửa</Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className={`fields${usesCredits ? '' : ' no-credits'}`}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subject-name">TÊN MÔN</Label>
                <Input
                  id="subject-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={usesCredits ? 'Lập trình Web' : 'Toán'}
                  aria-invalid={formErrors.name ? true : undefined}
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>
              {usesCredits && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="subject-credits">TÍN CHỈ</Label>
                  <Input
                    id="subject-credits"
                    type="number"
                    min="1"
                    max="10"
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                    placeholder="3"
                    aria-invalid={formErrors.credits ? true : undefined}
                  />
                  {formErrors.credits && <span className="field-error">{formErrors.credits}</span>}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subject-grade">ĐIỂM (THANG 10)</Label>
                <Input
                  id="subject-grade"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  placeholder="8.5"
                  aria-invalid={formErrors.grade ? true : undefined}
                />
                {formErrors.grade && <span className="field-error">{formErrors.grade}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subject-semester">HỌC KỲ</Label>
                {usesCredits ? (
                  <Select
                    value={form.semester}
                    onValueChange={(v) => setForm({ ...form, semester: v })}
                  >
                    <SelectTrigger id="subject-semester" className="w-full" aria-invalid={formErrors.semester ? true : undefined}>
                      <SelectValue placeholder="-- Chọn học kỳ --" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="subject-semester"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    placeholder="HK1-2026"
                    aria-invalid={formErrors.semester ? true : undefined}
                  />
                )}
                {formErrors.semester && <span className="field-error">{formErrors.semester}</span>}
              </div>
              {usesCredits && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="subject-year">NĂM HỌC</Label>
                  <Select
                    value={form.academicYear}
                    onValueChange={(v) => setForm({ ...form, academicYear: v })}
                  >
                    <SelectTrigger id="subject-year" className="w-full" aria-invalid={formErrors.academicYear ? true : undefined}>
                      <SelectValue placeholder="-- Chọn năm học --" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearOptions().map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.academicYear && (
                    <span className="field-error">{formErrors.academicYear}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Đang lưu…' : editingId ? 'Cập nhật' : 'Thêm môn học'}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Huỷ
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>

      <Card className="border-border ring-0">
        <CardHeader>
          <CardTitle>Danh sách môn học</CardTitle>
          {!loading && subjects.length > 0 && (
            <CardAction>
              <Badge variant="secondary">
                {visibleSubjects.length === subjects.length
                  ? `${subjects.length} môn`
                  : `${visibleSubjects.length}/${subjects.length} môn`}
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {!loading && subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên môn…"
                className="max-w-64"
              />
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả học kỳ</SelectItem>
                  {semesterChoices.map((sem) => (
                    <SelectItem key={sem} value={sem}>
                      {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {usesCredits && (
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Năm học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tất cả năm học</SelectItem>
                    {yearChoices.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(search || semesterFilter !== ALL || yearFilter !== ALL) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setSemesterFilter(ALL);
                    setYearFilter(ALL);
                  }}
                >
                  Xoá lọc
                </Button>
              )}
            </div>
          )}
          {loading ? (
            <div className="flex flex-col gap-3" aria-live="polite" aria-busy="true">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[88%]" />
              <Skeleton className="h-4 w-[94%]" />
              <Skeleton className="h-4 w-[76%]" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="empty">
              <p>Chưa có môn học nào.</p>
              <p>Thêm môn đầu tiên bằng biểu mẫu ở trên.</p>
            </div>
          ) : visibleSubjects.length === 0 ? (
            <div className="empty">
              <p>Không tìm thấy môn nào khớp bộ lọc.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button type="button" className="sort-head" onClick={() => toggleSort('name')}>
                      TÊN MÔN {sortIcon(sortKey === 'name', sortDir)}
                    </button>
                  </TableHead>
                  {usesCredits && (
                    <TableHead>
                      <button type="button" className="sort-head" onClick={() => toggleSort('credits')}>
                        SỐ TÍN {sortIcon(sortKey === 'credits', sortDir)}
                      </button>
                    </TableHead>
                  )}
                  <TableHead>
                    <button type="button" className="sort-head" onClick={() => toggleSort('grade')}>
                      {usesCredits ? 'ĐIỂM HỆ 10' : 'ĐIỂM'} {sortIcon(sortKey === 'grade', sortDir)}
                    </button>
                  </TableHead>
                  {usesCredits && <TableHead>ĐIỂM HỆ 4</TableHead>}
                  {usesCredits && <TableHead>ĐIỂM CHỮ</TableHead>}
                  {usesCredits && <TableHead>XẾP LOẠI</TableHead>}
                  <TableHead>
                    <button type="button" className="sort-head" onClick={() => toggleSort('semester')}>
                      HỌC KỲ {sortIcon(sortKey === 'semester', sortDir)}
                    </button>
                  </TableHead>
                  {usesCredits && (
                    <TableHead>
                      <button type="button" className="sort-head" onClick={() => toggleSort('academicYear')}>
                        NĂM HỌC {sortIcon(sortKey === 'academicYear', sortDir)}
                      </button>
                    </TableHead>
                  )}
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedSubjects.map((s) => (
                  <TableRow key={s._id} className={editingId === s._id ? 'is-editing' : ''}>
                    <TableCell className="name font-medium text-foreground">{s.name}</TableCell>
                    {usesCredits && <TableCell className="num">{s.credits}</TableCell>}
                    <TableCell>
                      <span className="grade">
                        <span className={`grade-dot ${gradeLevel(s.grade)}`} aria-hidden="true" />
                        <span className="grade-num">{s.grade.toFixed(1)}</span>
                        {!usesCredits && <span className="grade-letter">{s.label}</span>}
                      </span>
                    </TableCell>
                    {usesCredits && <TableCell className="num grade-num">{s.grade4.toFixed(1)}</TableCell>}
                    {usesCredits && <TableCell className="grade-letter">{s.letter}</TableCell>}
                    {usesCredits && <TableCell className="sem">{s.rank}</TableCell>}
                    <TableCell className="sem">{s.semester}</TableCell>
                    {usesCredits && <TableCell className="sem">{s.academicYear || '—'}</TableCell>}
                    <TableCell className="text-right">
                      <div className="row-actions">
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleEdit(s)}>
                          Sửa
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" />}>
                            Xoá
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xoá môn "{s.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Không thể hoàn tác. Điểm và mọi dữ liệu liên quan tới môn này sẽ mất.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Huỷ</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(s)}
                              >
                                Xoá môn
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && visibleSubjects.length > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Trang {currentPage}/{totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
