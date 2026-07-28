import { Router } from 'express';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import {
  validateSubject,
  calculateGPA,
  classify,
  gpaScale,
  gradeLabel,
  groupBySemester,
  toGrade4,
  subjectRank,
  LEVEL_SCHOOL,
  LEVEL_UNIVERSITY,
} from '../grade.js';

const router = Router();

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** Bậc phổ thông bỏ qua tín chỉ/năm học do người dùng gửi lên (nếu có), luôn ghi tín chỉ = 1. */
function buildPayload(body, level) {
  const payload = {
    name: body.name.trim(),
    credits: level === LEVEL_SCHOOL ? 1 : Number(body.credits),
    grade: Number(body.grade),
    semester: body.semester.trim(),
  };
  if (level === LEVEL_UNIVERSITY) payload.academicYear = String(body.academicYear).trim();
  return payload;
}

/** Điểm hệ 4 + điểm chữ + xếp loại riêng của môn, chỉ có ý nghĩa ở bậc đại học. */
function subjectExtras(grade10, level) {
  if (level !== LEVEL_UNIVERSITY) return {};
  const { letter, point } = toGrade4(grade10);
  return { grade4: point, letter, rank: subjectRank(letter) };
}

router.get(
  '/',
  wrap(async (req, res) => {
    const level = req.user.educationLevel;
    const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: -1 });
    const gpa = calculateGPA(subjects, level);
    res.json({
      subjects: subjects.map((s) => ({
        _id: s._id,
        name: s.name,
        credits: s.credits,
        grade: s.grade,
        semester: s.semester,
        academicYear: s.academicYear,
        label: gradeLabel(s.grade, level),
        ...subjectExtras(s.grade, level),
      })),
      gpa,
      gpaScale: gpaScale(level),
      classification: classify(gpa, level),
      educationLevel: level,
      semesters: groupBySemester(subjects, level),
    });
  })
);

router.get(
  '/:id',
  wrap(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  })
);

router.post(
  '/',
  wrap(async (req, res) => {
    const level = req.user.educationLevel;
    const errors = validateSubject(req.body, level);
    if (errors.length) return res.status(400).json({ errors });
    const subject = await Subject.create({
      ...buildPayload(req.body, level),
      user: req.user._id,
    });
    res.status(201).json(subject);
  })
);

router.put(
  '/:id',
  wrap(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const level = req.user.educationLevel;
    const errors = validateSubject(req.body, level);
    if (errors.length) return res.status(400).json({ errors });
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      buildPayload(req.body, level),
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.status(204).send();
  })
);

export default router;
