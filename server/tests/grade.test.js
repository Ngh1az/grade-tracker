import {
  calculateGPA,
  validateSubject,
  toGrade4,
  gradeLabel,
  subjectRank,
  classify,
  gpaScale,
  groupBySemester,
  isValidLevel,
  LEVEL_SCHOOL,
  LEVEL_UNIVERSITY,
} from '../src/grade.js';

describe('toGrade4 — quy đổi thang 10 sang thang 4 (bậc đại học)', () => {
  test.each([
    [10, 'A', 4],
    [8.5, 'A', 4],
    [8.4, 'B+', 3.5],
    [8, 'B+', 3.5],
    [7.9, 'B', 3],
    [7, 'B', 3],
    [6.9, 'C+', 2.5],
    [6.5, 'C+', 2.5],
    [6.4, 'C', 2],
    [5.5, 'C', 2],
    [5.4, 'D+', 1.5],
    [5, 'D+', 1.5],
    [4.9, 'D', 1],
    [4, 'D', 1],
    [3.9, 'F', 0],
    [0, 'F', 0],
  ])('điểm %s → %s (%s)', (grade10, letter, point) => {
    expect(toGrade4(grade10)).toEqual({ letter, point });
  });
});

describe('calculateGPA — bậc đại học (thang 4, theo tín chỉ)', () => {
  test('trả 0 khi chưa có môn nào', () => {
    expect(calculateGPA([], LEVEL_UNIVERSITY)).toBe(0);
  });

  test('bình quân theo tín chỉ trên điểm thang 4', () => {
    // 9.0 → A (4.0) × 3 tín chỉ; 6.0 → C (2.0) × 2 tín chỉ
    // (4×3 + 2×2) / 5 = 3.2
    const subjects = [
      { credits: 3, grade: 9 },
      { credits: 2, grade: 6 },
    ];
    expect(calculateGPA(subjects, LEVEL_UNIVERSITY)).toBe(3.2);
  });

  test('môn nhiều tín chỉ ảnh hưởng GPA nhiều hơn', () => {
    const heavyGood = calculateGPA(
      [
        { credits: 5, grade: 9 },
        { credits: 1, grade: 4 },
      ],
      LEVEL_UNIVERSITY
    );
    const heavyBad = calculateGPA(
      [
        { credits: 1, grade: 9 },
        { credits: 5, grade: 4 },
      ],
      LEVEL_UNIVERSITY
    );
    expect(heavyGood).toBeGreaterThan(heavyBad);
  });

  test('môn trượt kéo GPA xuống vì tính 0 điểm', () => {
    const subjects = [
      { credits: 3, grade: 10 },
      { credits: 3, grade: 3 },
    ];
    // (4×3 + 0×3) / 6 = 2.0
    expect(calculateGPA(subjects, LEVEL_UNIVERSITY)).toBe(2);
  });

  test('làm tròn 2 chữ số thập phân', () => {
    const subjects = [
      { credits: 3, grade: 7 },
      { credits: 4, grade: 8 },
      { credits: 2, grade: 9 },
    ];
    // (3×3 + 3.5×4 + 4×2) / 9 = 31/9 = 3.444…
    expect(calculateGPA(subjects, LEVEL_UNIVERSITY)).toBe(3.44);
  });
});

describe('calculateGPA — bậc phổ thông (thang 10, trung bình cộng)', () => {
  test('trả 0 khi chưa có môn nào', () => {
    expect(calculateGPA([], LEVEL_SCHOOL)).toBe(0);
  });

  test('là trung bình cộng điểm, giữ thang 10', () => {
    const subjects = [{ grade: 8 }, { grade: 7 }, { grade: 9 }];
    expect(calculateGPA(subjects, LEVEL_SCHOOL)).toBe(8);
  });

  test('bỏ qua tín chỉ — mọi môn trọng số bằng nhau', () => {
    const withCredits = [
      { credits: 10, grade: 4 },
      { credits: 1, grade: 8 },
    ];
    // Nếu tính theo tín chỉ sẽ ra ~4.4; phổ thông phải ra đúng 6
    expect(calculateGPA(withCredits, LEVEL_SCHOOL)).toBe(6);
  });

  test('làm tròn 2 chữ số thập phân', () => {
    const subjects = [{ grade: 8 }, { grade: 7 }, { grade: 7 }];
    expect(calculateGPA(subjects, LEVEL_SCHOOL)).toBe(7.33);
  });
});

describe('classify — xếp loại theo bậc', () => {
  test.each([
    [3.8, 'Xuất sắc'],
    [3.6, 'Xuất sắc'],
    [3.5, 'Giỏi'],
    [3.2, 'Giỏi'],
    [3.19, 'Khá'],
    [2.5, 'Khá'],
    [2.49, 'Trung bình'],
    [2, 'Trung bình'],
    [1.9, 'Không đạt'],
  ])('đại học: GPA %s → %s', (gpa, expected) => {
    expect(classify(gpa, LEVEL_UNIVERSITY)).toBe(expected);
  });

  test.each([
    [9, 'Giỏi'],
    [8, 'Giỏi'],
    [7.9, 'Khá'],
    [6.5, 'Khá'],
    [6.4, 'Trung bình'],
    [5, 'Trung bình'],
    [4.9, 'Yếu'],
    [3.5, 'Yếu'],
    [3.4, 'Kém'],
  ])('phổ thông: điểm %s → %s', (gpa, expected) => {
    expect(classify(gpa, LEVEL_SCHOOL)).toBe(expected);
  });

  test('chưa có dữ liệu thì không xếp loại', () => {
    expect(classify(0, LEVEL_SCHOOL)).toBe('Chưa có dữ liệu');
    expect(classify(0, LEVEL_UNIVERSITY)).toBe('Chưa có dữ liệu');
  });
});

describe('gradeLabel — nhãn điểm từng môn', () => {
  test('đại học dùng điểm chữ', () => {
    expect(gradeLabel(9, LEVEL_UNIVERSITY)).toBe('A');
    expect(gradeLabel(6.7, LEVEL_UNIVERSITY)).toBe('C+');
  });

  test('phổ thông dùng nhãn học lực tiếng Việt', () => {
    expect(gradeLabel(9, LEVEL_SCHOOL)).toBe('Giỏi');
    expect(gradeLabel(6.7, LEVEL_SCHOOL)).toBe('Khá');
    expect(gradeLabel(2, LEVEL_SCHOOL)).toBe('Kém');
  });
});

describe('subjectRank — xếp loại từng môn (bậc đại học)', () => {
  test.each([
    ['A', 'Giỏi'],
    ['B+', 'Khá'],
    ['B', 'Khá'],
    ['C+', 'Trung bình'],
    ['C', 'Trung bình'],
    ['D+', 'Trung bình yếu'],
    ['D', 'Trung bình yếu'],
    ['F', 'Không đạt'],
  ])('điểm chữ %s → %s', (letter, expected) => {
    expect(subjectRank(letter)).toBe(expected);
  });
});

describe('gpaScale và isValidLevel', () => {
  test('thang điểm đúng theo bậc', () => {
    expect(gpaScale(LEVEL_SCHOOL)).toBe(10);
    expect(gpaScale(LEVEL_UNIVERSITY)).toBe(4);
  });

  test('chỉ nhận đúng hai bậc học', () => {
    expect(isValidLevel(LEVEL_SCHOOL)).toBe(true);
    expect(isValidLevel(LEVEL_UNIVERSITY)).toBe(true);
    expect(isValidLevel('cao-hoc')).toBe(false);
    expect(isValidLevel(null)).toBe(false);
  });
});

describe('groupBySemester', () => {
  const subjects = [
    { name: 'A', credits: 3, grade: 9, semester: 'HK1', academicYear: '2025' },
    { name: 'B', credits: 2, grade: 6, semester: 'HK1', academicYear: '2025' },
    { name: 'C', credits: 4, grade: 8, semester: 'HK2', academicYear: '2025' },
  ];

  test('trả mảng rỗng khi chưa có môn nào', () => {
    expect(groupBySemester([], LEVEL_UNIVERSITY)).toEqual([]);
  });

  test('gom đúng số môn và tổng tín chỉ mỗi kỳ', () => {
    const result = groupBySemester(subjects, LEVEL_UNIVERSITY);
    expect(result).toHaveLength(2);
    const hk1 = result.find((r) => r.semester === 'HK1');
    expect(hk1.count).toBe(2);
    expect(hk1.credits).toBe(5);
  });

  test('kỳ mới nhất xếp lên đầu', () => {
    expect(groupBySemester(subjects, LEVEL_UNIVERSITY).map((r) => r.semester)).toEqual([
      'HK2',
      'HK1',
    ]);
  });

  test('không lẫn hai học kỳ trùng tên nhưng khác năm học', () => {
    const twoYears = [
      { credits: 3, grade: 9, semester: 'HK1', academicYear: '2024' },
      { credits: 3, grade: 5, semester: 'HK1', academicYear: '2025' },
    ];
    const result = groupBySemester(twoYears, LEVEL_UNIVERSITY);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.academicYear === '2024').gpa).toBe(4);
    expect(result.find((r) => r.academicYear === '2025').gpa).toBe(1.5);
  });

  test('GPA từng kỳ tính theo công thức bậc đại học', () => {
    const hk1 = groupBySemester(subjects, LEVEL_UNIVERSITY).find((r) => r.semester === 'HK1');
    // (4×3 + 2×2) / 5 = 3.2
    expect(hk1.gpa).toBe(3.2);
    expect(hk1.classification).toBe('Giỏi');
  });

  test('GPA từng kỳ tính theo công thức bậc phổ thông', () => {
    const hk1 = groupBySemester(subjects, LEVEL_SCHOOL).find((r) => r.semester === 'HK1');
    // trung bình cộng (9 + 6) / 2 = 7.5, bỏ qua tín chỉ
    expect(hk1.gpa).toBe(7.5);
    expect(hk1.classification).toBe('Khá');
  });
});

describe('validateSubject', () => {
  test('đại học: chấp nhận môn hợp lệ', () => {
    expect(
      validateSubject(
        { name: 'Toán', credits: 3, grade: 8, semester: 'HK1', academicYear: '2025' },
        LEVEL_UNIVERSITY
      )
    ).toEqual([]);
  });

  test('đại học: bắt buộc có tín chỉ hợp lệ', () => {
    const errors = validateSubject(
      { name: 'Toán', grade: 8, semester: 'HK1', academicYear: '2025' },
      LEVEL_UNIVERSITY
    );
    expect(errors).toContain('credits must be a number between 1 and 10');
  });

  test('đại học: bắt buộc có năm học là số có 4 chữ số', () => {
    const missing = validateSubject(
      { name: 'Toán', credits: 3, grade: 8, semester: 'HK1' },
      LEVEL_UNIVERSITY
    );
    expect(missing).toContain('academicYear must be a 4-digit year');

    const malformed = validateSubject(
      { name: 'Toán', credits: 3, grade: 8, semester: 'HK1', academicYear: '2025-2026' },
      LEVEL_UNIVERSITY
    );
    expect(malformed).toContain('academicYear must be a 4-digit year');
  });

  test('phổ thông: không cần tín chỉ hay năm học', () => {
    expect(
      validateSubject({ name: 'Toán', grade: 8, semester: 'HK1-2026' }, LEVEL_SCHOOL)
    ).toEqual([]);
  });

  test('thiếu tên môn thì báo lỗi ở cả hai bậc', () => {
    expect(validateSubject({ grade: 8, semester: 'HK1' }, LEVEL_SCHOOL)).toContain(
      'name is required'
    );
    expect(validateSubject({ grade: 8, semester: 'HK1', credits: 3 }, LEVEL_UNIVERSITY)).toContain(
      'name is required'
    );
  });

  test('điểm ngoài khoảng 0-10 bị từ chối', () => {
    const errors = validateSubject(
      { name: 'Lý', credits: 3, grade: 15, semester: 'HK1-2026' },
      LEVEL_UNIVERSITY
    );
    expect(errors).toContain('grade must be a number between 0 and 10');
  });

  test('thiếu học kỳ bị từ chối', () => {
    const errors = validateSubject({ name: 'Hóa', grade: 8 }, LEVEL_SCHOOL);
    expect(errors).toContain('semester is required');
  });
});
