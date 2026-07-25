import { Router } from 'express';
import mongoose from 'mongoose';
import Subject from '../models/Subject.js';
import { validateSubject, calculateGPA } from '../grade.js';

const router = Router();

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get(
  '/',
  wrap(async (req, res) => {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json({ subjects, gpa: calculateGPA(subjects) });
  })
);

router.get(
  '/:id',
  wrap(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  })
);

router.post(
  '/',
  wrap(async (req, res) => {
    const errors = validateSubject(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  })
);

router.put(
  '/:id',
  wrap(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const errors = validateSubject(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.status(204).send();
  })
);

export default router;
