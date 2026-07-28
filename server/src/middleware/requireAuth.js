import User from '../models/User.js';
import { verifyToken } from '../auth.js';

/**
 * Đọc Bearer token, gắn req.user. Trả 401 nếu thiếu/sai token
 * để client biết cần đăng nhập lại.
 */
export default async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });

  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn' });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
