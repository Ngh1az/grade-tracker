# Grade Tracker — Quản lý Môn học & Điểm số

Ứng dụng full-stack quản lý môn học và điểm số, deploy trên VPS Ubuntu với CI/CD tự động, thông báo Discord và hệ thống giám sát Prometheus + Grafana.

- **Website**: https://YOUR_DOMAIN
- **Grafana**: https://grafana.YOUR_DOMAIN
- **Stack**: React (Vite) + Node.js/Express + MongoDB + Nginx + PM2 + GitHub Actions + Prometheus/Grafana/Alertmanager

## Kiến trúc

```
                        Internet
                            │
                     ┌──────┴──────┐
                     │  ufw: 22/80/443  │
                     └──────┬──────┘
                            │ HTTPS (Let's Encrypt)
                     ┌──────▼───────────────────────────┐
                     │            Nginx                  │
                     │  YOUR_DOMAIN                      │
                     │   /        → /var/www/grade-tracker (React build)
                     │   /api/    → 127.0.0.1:5000
                     │   /metrics → deny (403)
                     │  grafana.YOUR_DOMAIN → 127.0.0.1:3000
                     └──────┬────────────────────┬───────┘
                            │                    │
              ┌─────────────▼──────┐    ┌────────▼─────────┐
              │  Express API (PM2) │    │  Grafana :3000    │
              │  127.0.0.1:5000    │    │  (docker)         │
              │  /api/health       │    └────────▲──────────┘
              │  /api/subjects     │             │
              │  /metrics          │◀────scrape──┤
              └─────────┬──────────┘             │
                        │              ┌─────────┴──────────┐
              ┌─────────▼──────────┐   │  Prometheus :9090   │
              │  MongoDB           │   │  (docker)           │
              │  127.0.0.1:27017   │   └──┬────────────┬─────┘
              │  auth: user/pass   │      │ scrape     │ alert
              └────────────────────┘      │            │
                                 ┌────────▼──────┐  ┌──▼──────────────┐
                                 │ node-exporter │  │ Alertmanager    │
                                 │ :9100         │  │ :9093           │
                                 └───────────────┘  └──┬──────────────┘
                                                       │ webhook
                                                ┌──────▼──────────────┐
                                                │ alertmanager-discord│
                                                │ :9094 (bridge)      │
                                                └──────┬──────────────┘
                                                       │
                                                  Discord channel
```

**Luồng CI/CD:**
```
git push main → GitHub Actions
                 ├─ job test    : npm ci + npm test (fail => dừng, production giữ bản cũ)
                 ├─ job build   : build client + install prod deps → release.tar.gz
                 ├─ job deploy  : scp lên VPS → rsync → pm2 reload → health check
                 │                (health fail => rollback bản trước + workflow đỏ)
                 └─ job notify  : Discord webhook ✅ / ❌ (kèm log link)
```

## Cấu trúc repo

```
.
├── client/                        React + Vite (build ra static)
│   └── src/{App.jsx,api.js,index.css}
├── server/                        Express API
│   ├── src/
│   │   ├── index.js               entrypoint: kết nối DB rồi listen
│   │   ├── app.js                 express app, /api/health, /metrics
│   │   ├── grade.js               logic GPA + validate (được unit test)
│   │   ├── metrics.js             prom-client counter + histogram
│   │   ├── db.js                  kết nối MongoDB
│   │   ├── models/Subject.js      Mongoose schema
│   │   └── routes/subjects.js     5 endpoint CRUD
│   ├── tests/
│   │   ├── grade.test.js          unit test logic GPA + validate
│   │   └── api.test.js            test HTTP: health, metrics, validate, 404
│   └── ecosystem.config.cjs       PM2 config
├── nginx/grade-tracker.conf       reverse proxy + HTTPS + rate limit
├── monitoring/
│   ├── docker-compose.yml         prometheus, alertmanager, discord bridge, node-exporter, grafana
│   ├── prometheus/{prometheus.yml,alert-rules.yml}
│   ├── alertmanager/alertmanager.yml
│   └── grafana/provisioning/      datasource + dashboard tự động
├── scripts/{backup-mongo.sh,health-check.sh}
├── .github/workflows/{ci.yml,deploy.yml}
└── RUNBOOK.md                     xử lý sự cố theo từng alert
```

## API

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/subjects` | Danh sách môn + GPA (trung bình theo tín chỉ) |
| GET | `/api/subjects/:id` | Chi tiết 1 môn |
| POST | `/api/subjects` | Tạo môn mới |
| PUT | `/api/subjects/:id` | Sửa môn |
| DELETE | `/api/subjects/:id` | Xoá môn |
| GET | `/api/health` | 200 nếu DB kết nối, 503 nếu không |
| GET | `/metrics` | Prometheus metrics (chặn từ internet qua Nginx) |

Entity `Subject`: `name` (string), `credits` (1-10), `grade` (0-10), `semester` (string), `createdAt`.

## Chạy local

```bash
cd server && npm install && cp .env.example .env && npm start
```

```bash
cd client && npm install && npm run dev
```

Vite dev server proxy `/api` về `localhost:5000`. Cần MongoDB chạy local hoặc sửa `MONGO_URI` trong `server/.env`.

Chạy test (12 test, không cần DB):
```bash
cd server && npm test
```

## Dựng lại hệ thống trên VPS Ubuntu

### 1. Cài đặt cơ bản

```bash
sudo apt update && sudo apt install -y nginx curl git rsync
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. MongoDB có auth, chỉ nghe 127.0.0.1

```bash
sudo apt install -y mongodb-org
```

Trong `/etc/mongod.conf`:
```yaml
net:
  port: 27017
  bindIp: 127.0.0.1
security:
  authorization: enabled
```

Tạo user riêng cho app (không dùng root):
```bash
mongosh
```
```javascript
use gradetracker
db.createUser({
  user: 'gradeapp',
  pwd: 'MẬT_KHẨU_MẠNH',
  roles: [{ role: 'readWrite', db: 'gradetracker' }]
})
```

```bash
sudo systemctl enable --now mongod
```

### 3. Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Các cổng 5000, 27017, 3000, 9090, 9093, 9100 đều bind `127.0.0.1` — không cần mở, không tiếp cận được từ ngoài.

### 4. Thư mục app + biến môi trường

```bash
sudo mkdir -p /var/www/grade-tracker /var/www/grade-tracker-api /var/log/grade-tracker
sudo chown -R $USER:$USER /var/www/grade-tracker-api /var/log/grade-tracker
```

Tạo `/var/www/grade-tracker-api/.env` (file này không bao giờ commit, deploy không ghi đè):
```
PORT=5000
MONGO_URI=mongodb://gradeapp:MẬT_KHẨU_MẠNH@127.0.0.1:27017/gradetracker?authSource=gradetracker
```

### 5. Nginx + HTTPS

```bash
sudo cp nginx/grade-tracker.conf /etc/nginx/sites-available/grade-tracker
sudo sed -i 's/YOUR_DOMAIN/domain-thật-của-bạn/g' /etc/nginx/sites-available/grade-tracker
sudo ln -sf /etc/nginx/sites-available/grade-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Lấy chứng chỉ (chạy trước khi enable block 443, hoặc dùng `--nginx` để Certbot tự sửa):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN -d grafana.YOUR_DOMAIN
```

Certbot tự tạo systemd timer gia hạn. Kiểm tra:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 6. PM2 tự chạy sau reboot

```bash
cd /var/www/grade-tracker-api
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # chạy lệnh sudo mà nó in ra
```

Kiểm chứng: `sudo reboot`, sau khi máy lên lại chạy `pm2 status` và `curl https://YOUR_DOMAIN/api/health`.

### 7. Monitoring stack

```bash
sudo apt install -y docker.io docker-compose-plugin
cd monitoring
cp .env.example .env   # điền DISCORD_WEBHOOK_URL, GRAFANA_ADMIN_PASSWORD, GRAFANA_ROOT_URL
sudo docker compose up -d
```

Grafana đã tự có datasource Prometheus và dashboard "Grade Tracker — Server & App".
Tạo account Viewer cho giảng viên: Grafana → Administration → Users → Invite, role **Viewer**.

### 8. Backup tự động (điểm cộng)

```bash
sudo cp scripts/backup-mongo.sh /usr/local/bin/ && sudo chmod +x /usr/local/bin/backup-mongo.sh
sudo mkdir -p /etc/grade-tracker
sudo tee /etc/grade-tracker/backup.env > /dev/null <<'EOF'
MONGO_URI=mongodb://gradeapp:MẬT_KHẨU_MẠNH@127.0.0.1:27017/gradetracker?authSource=gradetracker
EOF
sudo chmod 600 /etc/grade-tracker/backup.env
sudo crontab -e   # thêm: 0 2 * * * /usr/local/bin/backup-mongo.sh >> /var/log/grade-tracker/backup.log 2>&1
```

Khôi phục:
```bash
mongorestore --uri="$MONGO_URI" --archive=/var/backups/grade-tracker/xxx.archive.gz --gzip --drop
```

## GitHub Secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Nội dung |
|---|---|
| `SSH_HOST` | IP hoặc hostname VPS |
| `SSH_USER` | user deploy trên VPS |
| `SSH_PORT` | cổng SSH (bỏ trống nếu dùng 22) |
| `SSH_PRIVATE_KEY` | private key (ed25519), public key đã ở `~/.ssh/authorized_keys` trên VPS |
| `APP_DOMAIN` | domain thật, dùng để verify HTTPS sau deploy |
| `DISCORD_WEBHOOK_URL` | webhook Discord nhận thông báo deploy |

Không có secret nào nằm trong YAML hay source code. `.env`, key, token đều bị `.gitignore` chặn.

## Alert rules

| Alert | Ngưỡng | `for` | Vì sao |
|---|---|---|---|
| `AppDown` | `up == 0` | 1m | App chết là sự cố nghiêm trọng, nhưng chờ 1 phút để không báo trong lúc deploy reload |
| `HighCpuUsage` | > 80% | 5m | CPU nhảy vọt vài giây là bình thường (build, backup). Chỉ báo khi cao liên tục 5 phút |
| `HighMemoryUsage` | > 85% | 5m | Tránh báo vặt khi cache tăng tạm thời |
| `DiskSpaceLow` | còn < 15% | 10m | Đĩa đầy diễn ra chậm; 10 phút đủ để loại nhiễu do file tạm |
| `HighApiErrorRate` | > 5% 5xx | 5m | Một request lỗi lẻ không đáng báo; tỷ lệ cao kéo dài mới là vấn đề |

Alertmanager gửi cả FIRING và RESOLVED (`send_resolved: true`), nhắc lại mỗi 4h nếu chưa xử lý. Xem [RUNBOOK.md](RUNBOOK.md) để biết cách xử lý từng alert.

## Diễn tập sự cố

```bash
pm2 stop grade-tracker-api      # chờ ~1-2 phút → Discord nhận FIRING AppDown
pm2 start grade-tracker-api     # chờ ~1 phút → Discord nhận RESOLVED
```

## Điểm cộng đã làm

- **Backup DB tự động** — cron hằng ngày, nén gzip có timestamp, giữ 7 bản (`scripts/backup-mongo.sh`)
- **Rollback tự động** — health check fail sau deploy → tự quay về bản trước, workflow báo đỏ
- **Zero-downtime deploy** — `pm2 reload` thay vì `restart`
- **Rate limit Nginx** — 10r/s cho `/api`, burst 20
- **SSH key-only** — deploy dùng key ed25519, khuyến nghị tắt `PasswordAuthentication` trong `sshd_config`
- **Dashboard nghiệp vụ** — panel request/s theo route, latency p50/p95, request theo status code
- **Runbook** — hướng dẫn xử lý từng alert kèm lệnh cụ thể
