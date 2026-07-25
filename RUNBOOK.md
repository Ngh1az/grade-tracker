# Runbook — Grade Tracker

Tài liệu cho người trực: mỗi alert từ Discord, làm gì trước, làm gì sau, khi nào leo thang.

## Kiểm tra nhanh trước mọi việc

```bash
curl -s https://grades.nghiatech.click/api/health   # public path còn sống?
curl -s http://127.0.0.1:5000/api/health             # app còn sống?
pm2 status                                            # process còn chạy?
sudo systemctl status mongod nginx                    # DB và Nginx?
df -h / && free -h                                    # đĩa và RAM?
```

---

## GradeTrackerAPIDown — API không phản hồi

**Nghĩa là:** Prometheus không scrape được `127.0.0.1:5000/metrics` (job `grade-tracker-api`) trong 1 phút.

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

## NodeExporterDown — mất tín hiệu giám sát máy chủ

**Nghĩa là:** Prometheus không scrape được node-exporter — có thể VPS sập hẳn, không chỉ riêng app.

1. Thử SSH vào VPS. Không vào được → VPS có thể đã sập, kiểm tra qua control panel của nhà cung cấp VPS.
2. Vào được → kiểm tra container giám sát: `podman ps` (hoặc `docker ps`). node-exporter không chạy → `podman restart node-exporter`.
3. Đây là alert nói về hạ tầng giám sát, không phải về app — nếu node-exporter chết nhưng app vẫn sống,
   `GradeTrackerAPIDown` sẽ không fire kèm theo, giúp phân biệt "VPS/monitoring có vấn đề" với "app có vấn đề".

**Leo thang:** không SSH được vào VPS → sự cố hạ tầng, cần liên hệ nhà cung cấp VPS.

---

## HighCPU — CPU > 80% liên tục 5 phút

**Vì sao chờ 5 phút:** build, backup, `npm ci` đều đẩy CPU lên 100% trong thời gian ngắn. Báo ngay lập tức sẽ toàn là báo giả.

1. `top -o %CPU` hoặc `ps aux --sort=-%cpu | head` — process nào ăn CPU?
2. Nếu là app Node:
   ```bash
   pm2 logs grade-tracker-api --lines 100    # có vòng lặp lỗi không?
   pm2 monit
   ```
   Nghi ngờ traffic bất thường → xem Grafana panel "Requests / sec theo route" và `sudo tail -100 /var/log/nginx/access.log`. Rate limit Nginx đã đặt 10r/s; nếu vẫn quá tải, hạ ngưỡng trong `nginx/rate-limit-grade-tracker.conf`.
3. Nếu là `mongod` → query nặng, kiểm tra `db.currentOp()`.
4. Nếu là process lạ → kiểm tra bảo mật ngay: `last`, `sudo grep 'Failed password' /var/log/auth.log | tail`.

**Leo thang:** CPU cao > 30 phút không rõ nguyên nhân, hoặc nghi bị xâm nhập.

---

## HighRAM — RAM > 85% liên tục 5 phút

VPS chỉ có ~1GB RAM và chạy chung nhiều service (Mongo, Postgres, Prometheus/Grafana/Alertmanager,
node-exporter) — ngưỡng này dễ chạm hơn bình thường.

1. `free -h` và `ps aux --sort=-%mem | head`
2. PM2 đã cấu hình `max_memory_restart: 300M` — nếu app phình, PM2 tự restart. Kiểm tra số lần restart: `pm2 status`.
3. RAM do cache/buffer (`available` vẫn còn nhiều) thì thường không đáng lo — alert dùng `MemAvailable` nên đã loại trường hợp này.
4. Nếu MongoDB ăn RAM: bình thường (WiredTiger cache). Chỉ can thiệp khi swap bắt đầu bị dùng nhiều: `vmstat 1 5`.
5. Nếu cần giải phóng ngay: dừng service không đang dùng (ví dụ lab cũ đã tắt nhưng còn cài, hoặc Postgres nếu không service nào cần).

**Leo thang:** hệ thống bắt đầu swap nặng / OOM killer xuất hiện trong `dmesg`.

---

## DiskAlmostFull — Đĩa `/` đã dùng trên 85%

1. Tìm thủ phạm:
   ```bash
   df -h /
   sudo du -sh /var/log/* /var/backups/* /var/lib/containers/* 2>/dev/null | sort -h | tail
   ```
2. Dọn theo thứ tự an toàn:
   ```bash
   pm2 flush                                   # xoá log PM2
   sudo journalctl --vacuum-time=3d            # thu gọn journal
   podman system prune -f                      # image/container rác (podman, không phải docker trên VPS này)
   ls -lt /var/backups/grade-tracker/          # xoá backup cũ nếu cần
   ```
3. Prometheus retention đang là 15 ngày (nếu chạy compose riêng). Nếu dùng chung stack có sẵn, kiểm tra
   dung lượng `prometheus-data` volume của stack đó.

**Leo thang:** dọn xong vẫn trên 80% → cần nâng dung lượng đĩa VPS.

---

## Sau mọi sự cố

- Chờ tin **RESOLVED** trong Discord để xác nhận đã khôi phục thật.
- Ghi lại: sự cố gì, nguyên nhân, đã làm gì, mất bao lâu.
- Nếu alert báo sai (báo vặt) → điều chỉnh ngưỡng hoặc `for` trong `monitoring/prometheus/alert-rules.yml`
  (và trong file tương ứng trên VPS nếu đang dùng chung stack có sẵn thay vì compose trong repo).
