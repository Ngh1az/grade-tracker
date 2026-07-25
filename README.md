# Grade Tracker — Quản lý Môn học & Điểm số

Ứng dụng full-stack quản lý môn học và điểm số, deploy trên VPS Ubuntu với CI/CD tự động, thông báo Discord và hệ thống giám sát Prometheus + Grafana.

- **Website**: https://grades.nghiatech.click
- **Grafana**: https://grafana.nghiatech.click (dashboard "Grade Tracker — Server & App")
- **Stack**: React (Vite) + Node.js/Express + MongoDB + Nginx + PM2 + GitHub Actions + Prometheus/Grafana/Alertmanager

VPS này đã chạy vài lab trước (go-shop, MERN deploy lab). Grade Tracker deploy song song, tái dùng
Prometheus/Grafana/Alertmanager/node-exporter đã có sẵn (thêm scrape job + alert rule + dashboard riêng)
thay vì dựng stack mới — VPS chỉ có ~1GB RAM. Các lab không dùng nữa (WebShopServer, demo-api, go-shop)
đã được dừng để giải phóng RAM/port cho lab này.

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
                     │  grades.nghiatech.click            │
                     │   /        → /var/www/grade-tracker (React build)
                     │   /api/    → 127.0.0.1:5000
                     │   /metrics → deny (403)
                     │  grafana.nghiatech.click → 127.0.0.1:3001
                     └──────┬────────────────────┬───────┘
                            │                    │
              ┌─────────────▼──────┐    ┌────────▼─────────┐
              │  Express API (PM2) │    │  Grafana :3001    │
              │  127.0.0.1:5000    │    │  (podman, shared) │
              │  /api/health       │    └────────▲──────────┘
              │  /api/subjects     │             │
              │  /metrics          │◀────scrape──┤
              └─────────┬──────────┘             │
                        │              ┌─────────┴──────────┐
              ┌─────────▼──────────┐   │  Prometheus :9090   │
              │  MongoDB           │   │  (podman, shared)   │
              │  127.0.0.1:27017   │   └──┬────────────┬─────┘
              │  auth: gradeapp/pw │      │ scrape     │ alert
              └────────────────────┘      │            │
                                 ┌────────▼──────┐  ┌──▼──────────────┐
                                 │ node-exporter │  │ Alertmanager    │
                                 │ :9100 (shared)│  │ :9093 (shared)  │
                                 └───────────────┘  └──┬──────────────┘
                                                       │ discord_configs
                                                       │ (native, Alertmanager >= 0.27)
                                                  Discord channel
```

"shared" = container đã chạy từ lab Monitoring trước, dùng chung cho cả VPS; Grade Tracker
chỉ thêm scrape job `grade-tracker-api` + alert rules + 1 dashboard riêng vào đó.

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
├── nginx/
│   ├── grade-tracker.conf         app: reverse proxy + rate limit (certbot thêm SSL)
│   ├── rate-limit-grade-tracker.conf  limit_req_zone (scope http{}, load qua conf.d)
│   └── grafana.conf               expose Grafana chung qua HTTPS subdomain
├── monitoring/                    template dựng stack Prometheus/Grafana từ đầu (VPS mới)
│   ├── docker-compose.yml         prometheus, alertmanager, node-exporter, grafana
│   ├── prometheus/{prometheus.yml,alert-rules.yml}
│   ├── alertmanager/alertmanager.yml   discord_configs native (Alertmanager >= 0.27)
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

`/etc/mongod.conf` cần `net.bindIp: 127.0.0.1` (mặc định trên bản cài mới) và thêm block `security`.
Tạo user **trước khi** bật `authorization` (lúc chưa có `security:`, mongosh còn vào được không cần
mật khẩu qua "localhost exception"):

```bash
mongosh --quiet --eval '
db.getSiblingDB("admin").createUser({
  user: "mongoadmin", pwd: "MẬT_KHẨU_ADMIN",
  roles: [{ role: "root", db: "admin" }]
})'

mongosh --quiet --eval '
db.getSiblingDB("gradetracker").createUser({
  user: "gradeapp", pwd: "MẬT_KHẨU_APP",
  roles: [{ role: "readWrite", db: "gradetracker" }]
})'
```

Rồi thêm vào cuối `/etc/mongod.conf`:
```yaml
security:
  authorization: enabled
```

```bash
sudo systemctl restart mongod
# verify: không auth phải bị chặn
mongosh --quiet --eval 'db.getSiblingDB("gradetracker").subjects.find()'   # -> MongoServerError: requires authentication
```

Nếu Mongo này đang được lab khác dùng chung (không có auth từ trước), bật `authorization` sẽ
chặn luôn app đó — kiểm tra `mongosh --eval 'db.getSiblingDB("admin").system.users.find()'` trước,
và tạo thêm user cho app đó hoặc dừng nó trước khi bật auth.

### 3. Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Các cổng 5000, 27017, 3001, 9090, 9093, 9100 đều bind `127.0.0.1` — không cần mở, không tiếp cận được từ ngoài.

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
sudo cp nginx/grafana.conf /etc/nginx/sites-available/grafana
sudo cp nginx/rate-limit-grade-tracker.conf /etc/nginx/conf.d/
sudo ln -sf /etc/nginx/sites-available/grade-tracker /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/grafana /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Lấy chứng chỉ (certbot tự sửa nginx config để redirect HTTP→HTTPS):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d grades.nghiatech.click -d grafana.nghiatech.click --redirect
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

Kiểm chứng: `sudo reboot`, sau khi máy lên lại chạy `pm2 status` và `curl https://grades.nghiatech.click/api/health`.

### 7. Monitoring stack

**VPS mới, chưa có gì:** dùng nguyên `monitoring/docker-compose.yml`:
```bash
sudo apt install -y docker.io docker-compose-plugin
cd monitoring
cp .env.example .env   # điền DISCORD_WEBHOOK_URL, GRAFANA_ADMIN_PASSWORD, GRAFANA_ROOT_URL
sudo docker compose up -d
```

**VPS đã có Prometheus/Grafana/Alertmanager chạy sẵn (trường hợp thật của lab này):** không chạy
compose mới (tốn thêm RAM), chỉ merge nội dung `monitoring/prometheus/prometheus.yml` và
`alert-rules.yml` vào file tương ứng của stack có sẵn (thêm job/rule, giữ nguyên job/rule cũ của
lab khác), rồi `podman restart prometheus alertmanager` (hoặc `docker compose restart`). Dashboard
thì import qua API thay vì đợi provisioning quét lại:
```bash
curl -u admin:MẬT_KHẨU_GRAFANA -X POST -H 'Content-Type: application/json' \
  -d "{\"dashboard\": $(cat monitoring/grafana/provisioning/dashboards/grade-tracker.json | sed 's/"id":.*,/"id": null,/'), \"overwrite\": true}" \
  http://127.0.0.1:3001/api/dashboards/db
```

Grafana có datasource Prometheus và dashboard "Grade Tracker — Server & App".
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

Repo → Settings → Secrets and variables → Actions. Cả 5 đã set cho repo này:

| Secret | Nội dung |
|---|---|
| `SSH_HOST` | `162.4.176.230` |
| `SSH_USER` | `root` |
| `SSH_PORT` | bỏ trống, dùng 22 |
| `SSH_PRIVATE_KEY` | key ed25519 riêng cho CI (`github-actions-grade-tracker`), tách biệt key cá nhân và key của lab khác trên cùng VPS — append vào `authorized_keys`, không thay key nào có sẵn |
| `APP_DOMAIN` | `grades.nghiatech.click` |
| `DISCORD_WEBHOOK_URL` | webhook Discord riêng cho repo này |

Không có secret nào nằm trong YAML hay source code. `.env`, key, token đều bị `.gitignore` chặn.

## Alert rules

| Alert | Ngưỡng | `for` | Vì sao |
|---|---|---|---|
| `GradeTrackerAPIDown` | `up == 0` | 1m | App chết là sự cố nghiêm trọng, nhưng chờ 1 phút để không báo giả trong lúc deploy reload |
| `NodeExporterDown` | `up == 0` | 1m | Mất tín hiệu giám sát máy chủ — có thể VPS sập hẳn, không chỉ app |
| `HighCPU` | > 80% | 5m | CPU nhảy vọt vài giây là bình thường (build, backup). Chỉ báo khi cao liên tục 5 phút |
| `HighRAM` | > 85% | 5m | Tránh báo vặt khi cache tăng tạm thời; VPS chỉ ~1GB RAM nên ngưỡng này khá sát |
| `DiskAlmostFull` | > 85% đã dùng | 10m | Đĩa đầy diễn ra chậm; 10 phút đủ để loại nhiễu do file tạm |

Alertmanager gửi cả FIRING và RESOLVED (`send_resolved: true`) qua `discord_configs` (native, Alertmanager
>= 0.27 — không cần container bridge), nhắc lại mỗi 3h nếu chưa xử lý. Xem [RUNBOOK.md](RUNBOOK.md) để
biết cách xử lý từng alert.

## Diễn tập sự cố

```bash
pm2 stop grade-tracker-api      # chờ ~1 phút → Discord nhận FIRING GradeTrackerAPIDown
pm2 start grade-tracker-api     # chờ ~1 phút (scrape lại thấy up) → Discord nhận RESOLVED
```

## Điểm cộng đã làm

- **Backup DB tự động** — cron hằng ngày, nén gzip có timestamp, giữ 7 bản (`scripts/backup-mongo.sh`)
- **Rollback tự động** — health check fail sau deploy → tự quay về bản trước, workflow báo đỏ
- **Zero-downtime deploy** — `pm2 reload` thay vì `restart`
- **Rate limit Nginx** — 10r/s cho `/api`, burst 20
- **SSH key-only** — deploy dùng key ed25519, khuyến nghị tắt `PasswordAuthentication` trong `sshd_config`
- **Dashboard nghiệp vụ** — panel request/s theo route, latency p50/p95, request theo status code
- **Runbook** — hướng dẫn xử lý từng alert kèm lệnh cụ thể
