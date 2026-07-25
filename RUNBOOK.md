# Runbook — Grade Tracker

Tài liệu cho người trực: mỗi alert từ Discord, làm gì trước, làm gì sau, khi nào leo thang.

## Kiểm tra nhanh trước mọi việc

```bash
curl -s https://YOUR_DOMAIN/api/health          # public path còn sống?
curl -s http://127.0.0.1:5000/api/health        # app còn sống?
pm2 status                                       # process còn chạy?
sudo systemctl status mongod nginx               # DB và Nginx?
df -h / && free -h                               # đĩa và RAM?
```

---

## AppDown — API không phản hồi

**Nghĩa là:** Prometheus không scrape được `127.0.0.1:5000/metrics` trong 1 phút.

1. `pm2 status` — process ở trạng thái gì?
   - `stopped` / `errored` → `pm2 logs grade-tracker-api --lines 100` tìm lỗi, rồi `pm2 restart grade-tracker-api`
   - `online` nhưng restart count tăng liên tục → app crash loop, đọc log tìm nguyên nhân (thường là `.env` sai hoặc DB từ chối kết nối)
   - Không thấy process → `cd /var/www/grade-tracker-api && pm2 start ecosystem.config.cjs && pm2 save`
2. Nếu app online mà health vẫn 503 → DB có vấn đề:
   ```bash
   sudo systemctl status mongod
   sudo systemctl restart mongod
   mongosh "$MONGO_URI" --eval 'db.runCommand({ping:1})'
   ```
3. Nếu app + DB đều ổn mà public URL vẫn lỗi → Nginx:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   sudo tail -50 /var/log/nginx/error.log
   ```

**Leo thang:** không khôi phục được trong 15 phút → thông báo và xem xét rollback bản deploy gần nhất (`/var/backups/grade-tracker-releases/previous`).

---

## HighCpuUsage — CPU > 80% liên tục 5 phút

**Vì sao chờ 5 phút:** build, backup, `npm ci` đều đẩy CPU lên 100% trong thời gian ngắn. Báo ngay lập tức sẽ toàn là báo giả.

1. `top -o %CPU` hoặc `ps aux --sort=-%cpu | head` — process nào ăn CPU?
2. Nếu là app Node:
   ```bash
   pm2 logs grade-tracker-api --lines 100    # có vòng lặp lỗi không?
   pm2 monit
   ```
   Nghi ngờ traffic bất thường → xem Grafana panel "Requests / sec theo route" và `sudo tail -100 /var/log/nginx/access.log`. Rate limit Nginx đã đặt 10r/s; nếu vẫn quá tải, hạ ngưỡng trong `nginx/grade-tracker.conf`.
3. Nếu là `mongod` → query nặng, kiểm tra `db.currentOp()`.
4. Nếu là process lạ → kiểm tra bảo mật ngay: `last`, `sudo grep 'Failed password' /var/log/auth.log | tail`.

**Leo thang:** CPU cao > 30 phút không rõ nguyên nhân, hoặc nghi bị xâm nhập.

---

## HighMemoryUsage — RAM > 85% liên tục 5 phút

1. `free -h` và `ps aux --sort=-%mem | head`
2. PM2 đã cấu hình `max_memory_restart: 300M` — nếu app phình, PM2 tự restart. Kiểm tra số lần restart: `pm2 status`.
3. RAM do cache/buffer (`available` vẫn còn nhiều) thì thường không đáng lo — alert dùng `MemAvailable` nên đã loại trường hợp này.
4. Nếu MongoDB ăn RAM: bình thường (WiredTiger cache). Chỉ can thiệp khi swap bắt đầu bị dùng nhiều: `vmstat 1 5`.

**Leo thang:** hệ thống bắt đầu swap nặng / OOM killer xuất hiện trong `dmesg`.

---

## DiskSpaceLow — Đĩa `/` còn dưới 15%

1. Tìm thủ phạm:
   ```bash
   df -h /
   sudo du -sh /var/log/* /var/backups/* /var/lib/docker 2>/dev/null | sort -h | tail
   ```
2. Dọn theo thứ tự an toàn:
   ```bash
   pm2 flush                                   # xoá log PM2
   sudo journalctl --vacuum-time=3d            # thu gọn journal
   sudo docker system prune -f                 # image/container rác
   ls -lt /var/backups/grade-tracker/          # xoá backup cũ nếu cần
   ```
3. Prometheus retention đang là 15 ngày. Nếu `prometheus-data` quá lớn, hạ xuống trong `monitoring/docker-compose.yml` (`--storage.tsdb.retention.time`).

**Leo thang:** dọn xong vẫn dưới 20% → cần nâng dung lượng đĩa VPS.

---

## HighApiErrorRate — Trên 5% request trả 5xx

1. `pm2 logs grade-tracker-api --lines 100` — stack trace nói gì?
2. `curl -s localhost:5000/api/health` — DB còn kết nối?
3. Xem Grafana panel "Requests theo status code" để biết lỗi bắt đầu từ lúc nào; đối chiếu với thời điểm deploy gần nhất trong tab Actions.
4. Nếu lỗi xuất hiện ngay sau một lần deploy → rollback:
   ```bash
   sudo rsync -a --delete --exclude='.env' /var/backups/grade-tracker-releases/previous/ /var/www/grade-tracker-api/
   cd /var/www/grade-tracker-api && pm2 reload ecosystem.config.cjs --update-env
   ```

**Leo thang:** tỷ lệ lỗi > 20% hoặc rollback không cứu được.

---

## Sau mọi sự cố

- Chờ tin **RESOLVED** trong Discord để xác nhận đã khôi phục thật.
- Ghi lại: sự cố gì, nguyên nhân, đã làm gì, mất bao lâu.
- Nếu alert báo sai (báo vặt) → điều chỉnh ngưỡng hoặc `for` trong `monitoring/prometheus/alert-rules.yml`.
