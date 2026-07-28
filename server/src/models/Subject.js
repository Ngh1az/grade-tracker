import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    // Mỗi môn thuộc về một người dùng; mọi truy vấn đều lọc theo trường này
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    // Bậc phổ thông không dùng tín chỉ nên mặc định 1 (mọi môn trọng số bằng nhau)
    credits: { type: Number, required: true, min: 1, max: 10, default: 1 },
    grade: { type: Number, required: true, min: 0, max: 10 },
    semester: { type: String, required: true, trim: true },
    // Chỉ dùng ở bậc đại học ("2025-2026"); phổ thông không set field này
    academicYear: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Subject', subjectSchema);
