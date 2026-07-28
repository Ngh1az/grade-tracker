import mongoose from 'mongoose';
import { LEVELS } from '../grade.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    // null cho tới khi người dùng chọn bậc học ở lần đăng nhập đầu
    educationLevel: { type: String, enum: [...LEVELS, null], default: null },
  },
  { timestamps: true }
);

// Không bao giờ trả passwordHash ra ngoài
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    email: this.email,
    educationLevel: this.educationLevel,
  };
};

export default mongoose.model('User', userSchema);
