export const LEVEL_SCHOOL = 'pho-thong';
export const LEVEL_UNIVERSITY = 'dai-hoc';
export const LEVELS = [LEVEL_SCHOOL, LEVEL_UNIVERSITY];

export function isValidLevel(level) {
  return LEVELS.includes(level);
}

/**
 * Bậc phổ thông chấm trên thang 10 (trung bình cộng các môn, không dùng tín chỉ).
 * Bậc đại học quy về thang 4 theo tín chỉ.
 */
export function gpaScale(level) {
  return level === LEVEL_UNIVERSITY ? 4 : 10;
}

/**
 * Quy đổi điểm thang 10 sang điểm chữ + điểm thang 4 (Thông tư 08/2021, bậc đại học).
 */
export function toGrade4(grade10) {
  const g = Number(grade10);
  if (!Number.isFinite(g)) return { letter: 'F', point: 0 };
  if (g >= 8.5) return { letter: 'A', point: 4 };
  if (g >= 8) return { letter: 'B+', point: 3.5 };
  if (g >= 7) return { letter: 'B', point: 3 };
  if (g >= 6.5) return { letter: 'C+', point: 2.5 };
  if (g >= 5.5) return { letter: 'C', point: 2 };
  if (g >= 5) return { letter: 'D+', point: 1.5 };
  if (g >= 4) return { letter: 'D', point: 1 };
  return { letter: 'F', point: 0 };
}

/**
 * Điểm chữ hiển thị theo từng bậc. Phổ thông không dùng điểm chữ chính thức,
 * nên trả về nhãn học lực rút gọn của riêng môn đó.
 */
export function gradeLabel(grade10, level) {
  if (level === LEVEL_UNIVERSITY) return toGrade4(grade10).letter;
  const g = Number(grade10);
  if (!Number.isFinite(g)) return 'Kém';
  if (g >= 8) return 'Giỏi';
  if (g >= 6.5) return 'Khá';
  if (g >= 5) return 'TB';
  if (g >= 3.5) return 'Yếu';
  return 'Kém';
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Phổ thông: trung bình cộng điểm các môn, giữ thang 10.
 * Đại học: bình quân điểm thang 4 có trọng số theo tín chỉ.
 */
export function calculateGPA(subjects, level = LEVEL_UNIVERSITY) {
  if (!subjects || subjects.length === 0) return 0;

  if (level === LEVEL_SCHOOL) {
    const sum = subjects.reduce((total, s) => total + Number(s.grade), 0);
    return round2(sum / subjects.length);
  }

  const totalCredits = subjects.reduce((total, s) => total + Number(s.credits), 0);
  if (totalCredits === 0) return 0;
  const weighted = subjects.reduce(
    (total, s) => total + Number(s.credits) * toGrade4(s.grade).point,
    0
  );
  return round2(weighted / totalCredits);
}

/**
 * Xếp loại: phổ thông theo học lực thang 10, đại học theo Thông tư 08/2021 thang 4.
 */
export function classify(gpa, level = LEVEL_UNIVERSITY) {
  const g = Number(gpa);
  if (!Number.isFinite(g) || g <= 0) return 'Chưa có dữ liệu';

  if (level === LEVEL_SCHOOL) {
    if (g >= 8) return 'Giỏi';
    if (g >= 6.5) return 'Khá';
    if (g >= 5) return 'Trung bình';
    if (g >= 3.5) return 'Yếu';
    return 'Kém';
  }

  if (g >= 3.6) return 'Xuất sắc';
  if (g >= 3.2) return 'Giỏi';
  if (g >= 2.5) return 'Khá';
  if (g >= 2) return 'Trung bình';
  return 'Không đạt';
}

/**
 * Gom môn theo học kỳ, tính GPA từng kỳ bằng đúng công thức của bậc đang chọn.
 * Sắp xếp giảm dần theo tên học kỳ để kỳ mới nhất lên đầu.
 */
export function groupBySemester(subjects, level = LEVEL_UNIVERSITY) {
  const buckets = new Map();
  for (const s of subjects || []) {
    if (!buckets.has(s.semester)) buckets.set(s.semester, []);
    buckets.get(s.semester).push(s);
  }

  return [...buckets.entries()]
    .map(([semester, items]) => {
      const gpa = calculateGPA(items, level);
      return {
        semester,
        count: items.length,
        credits: items.reduce((total, s) => total + Number(s.credits), 0),
        gpa,
        classification: classify(gpa, level),
      };
    })
    .sort((a, b) => b.semester.localeCompare(a.semester));
}

export function validateSubject(input, level = LEVEL_UNIVERSITY) {
  const errors = [];
  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
    errors.push('name is required');
  }
  // Phổ thông không có tín chỉ — mỗi môn tính trọng số bằng nhau.
  if (level === LEVEL_UNIVERSITY) {
    const credits = Number(input.credits);
    if (!Number.isFinite(credits) || credits < 1 || credits > 10) {
      errors.push('credits must be a number between 1 and 10');
    }
  }
  const grade = Number(input.grade);
  if (!Number.isFinite(grade) || grade < 0 || grade > 10) {
    errors.push('grade must be a number between 0 and 10');
  }
  if (!input.semester || typeof input.semester !== 'string' || !input.semester.trim()) {
    errors.push('semester is required');
  }
  return errors;
}
