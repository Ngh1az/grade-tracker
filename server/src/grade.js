export function validateSubject(input) {
  const errors = [];
  if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
    errors.push('name is required');
  }
  const credits = Number(input.credits);
  if (!Number.isFinite(credits) || credits < 1 || credits > 10) {
    errors.push('credits must be a number between 1 and 10');
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

export function calculateGPA(subjects) {
  if (!subjects || subjects.length === 0) return 0;
  const totalCredits = subjects.reduce((sum, s) => sum + Number(s.credits), 0);
  if (totalCredits === 0) return 0;
  const weighted = subjects.reduce((sum, s) => sum + Number(s.credits) * Number(s.grade), 0);
  return Math.round((weighted / totalCredits) * 100) / 100;
}
