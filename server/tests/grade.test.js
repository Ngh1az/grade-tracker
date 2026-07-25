import { calculateGPA, validateSubject } from '../src/grade.js';

describe('calculateGPA', () => {
  test('returns 0 for empty list', () => {
    expect(calculateGPA([])).toBe(0);
  });

  test('computes credit-weighted average', () => {
    const subjects = [
      { credits: 3, grade: 8 },
      { credits: 2, grade: 5 },
    ];
    expect(calculateGPA(subjects)).toBe(6.8);
  });

  test('rounds to 2 decimal places', () => {
    const subjects = [
      { credits: 3, grade: 7 },
      { credits: 4, grade: 8 },
      { credits: 2, grade: 9 },
    ];
    expect(calculateGPA(subjects)).toBe(7.89);
  });
});

describe('validateSubject', () => {
  test('accepts a valid subject', () => {
    expect(
      validateSubject({ name: 'Toán', credits: 3, grade: 8, semester: 'HK1-2026' })
    ).toEqual([]);
  });

  test('rejects missing name', () => {
    const errors = validateSubject({ credits: 3, grade: 8, semester: 'HK1-2026' });
    expect(errors).toContain('name is required');
  });

  test('rejects grade out of range', () => {
    const errors = validateSubject({ name: 'Lý', credits: 3, grade: 15, semester: 'HK1-2026' });
    expect(errors).toContain('grade must be a number between 0 and 10');
  });

  test('rejects credits out of range', () => {
    const errors = validateSubject({ name: 'Hóa', credits: 0, grade: 8, semester: 'HK1-2026' });
    expect(errors).toContain('credits must be a number between 1 and 10');
  });
});
