/**
 * Điểm và GPA chỉ có nghĩa khi đã biết bậc học (thang 10 hay thang 4),
 * nên chặn mọi thao tác môn học tới khi người dùng chọn bậc.
 * Trả 409 để client phân biệt với 401 (chưa đăng nhập) và mở màn chọn bậc.
 */
export default function requireLevel(req, res, next) {
  if (!req.user.educationLevel) {
    return res.status(409).json({ error: 'Chưa chọn bậc học', code: 'LEVEL_REQUIRED' });
  }
  next();
}
