import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1, max: 10 },
    grade: { type: Number, required: true, min: 0, max: 10 },
    semester: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Subject', subjectSchema);
