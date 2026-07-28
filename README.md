# Grade Tracker — Quản lý Môn học & Điểm số

Ứng dụng full-stack quản lý môn học và điểm số, deploy trên VPS Ubuntu với CI/CD tự động, thông báo Discord và hệ thống giám sát Prometheus + Grafana.

- **Website**: https://grades.nghiatech.click
- **Grafana**: https://grafana.nghiatech.click (dashboard "Grade Tracker — Server & App")
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
│   └── src/
│       ├── App.jsx                điều phối: chưa đăng nhập → chưa chọn bậc → app
│       ├── AuthScreen.jsx         đăng nhập / đăng ký (có xác nhận mật khẩu)
│       ├── PasswordInput.jsx      ô mật khẩu kèm nút hiện/ẩn
│       ├── LevelPicker.jsx        chọn bậc phổ thông / đại học
│       ├── SubjectsView.jsx       CRUD môn học, đổi theo bậc
│       ├── BrandMark.jsx          logo SVG
│       ├── api.js                 fetch + gắn Bearer token, ApiError có mã
│       └── index.css              design system (token Linear)
├── server/                        Express API
│   ├── src/
│   │   ├── index.js               entrypoint: kết nối DB rồi listen
│   │   ├── app.js                 express app, /api/health, /metrics, gắn router
│   │   ├── grade.js               GPA + quy đổi thang 4 + validate theo bậc (unit test)
│   │   ├── auth.js                bcrypt hash, ký/xác thực JWT (unit test)
│   │   ├── metrics.js             prom-client counter + histogram
│   │   ├── db.js                  kết nối MongoDB
│   │   ├── middleware/
│   │   │   ├── requireAuth.js     đọc Bearer token → req.user, 401 nếu sai
│   │   │   └── requireLevel.js    409 LEVEL_REQUIRED nếu chưa chọn bậc
│   │   ├── models/{User.js,Subject.js}
│   │   └── routes/{auth.js,subjects.js}
│   ├── tests/
│   │   ├── grade.test.js          GPA hai bậc, mốc quy đổi thang 4, validate
│   │   ├── auth.test.js           hash/verify mật khẩu, ký/xác thực token
│   │   └── api.test.js            health, metrics, chặn truy cập thiếu token, 404
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

## Tài khoản và bậc học

Mỗi người dùng đăng ký bằng email + mật khẩu (băm bcrypt, 10 vòng). Đăng nhập trả về JWT hạn 7
ngày; client gửi kèm `Authorization: Bearer <token>`. Môn học gắn với `user` và **mọi truy vấn đều
lọc theo chủ sở hữu** — tài khoản này không đọc/sửa/xoá được môn của tài khoản khác (trả 404, không
phải 403, để không tiết lộ id đó có tồn tại). Đăng nhập sai email và sai mật khẩu trả về **cùng một
thông báo**, tránh để lộ email nào đã đăng ký.

Sau khi đăng nhập, người dùng chọn bậc học — vì hai hệ tính GPA khác nhau, con số GPA vô nghĩa nếu
không biết đang ở bậc nào:

| | Giáo dục phổ thông | Giáo dục đại học |
|---|---|---|
| Tín chỉ | không dùng | có, là trọng số |
| Năm học | không dùng | có, 1 số (năm bắt đầu niên khoá, ví dụ `2025`) |
| Thang GPA | 10 | 4 (quy đổi từ thang 10) |
| Cách tính | trung bình cộng điểm các môn | bình quân điểm thang 4 theo tín chỉ |
| Cột hiển thị mỗi môn | Tên môn · Điểm · Học kỳ | Tên môn · Số tín · Điểm hệ 10 · Điểm hệ 4 · Điểm chữ · Xếp loại môn · Học kỳ · Năm học |
| Xếp loại môn (riêng từng môn) | Giỏi · Khá · TB · Yếu · Kém | Giỏi (A) · Khá (B+/B) · Trung bình (C+/C) · Trung bình yếu (D+/D) · Không đạt (F) |
| Xếp loại GPA (toàn khoá) | Giỏi ≥8 · Khá ≥6.5 · TB ≥5 · Yếu ≥3.5 · Kém | Xuất sắc ≥3.6 · Giỏi ≥3.2 · Khá ≥2.5 · TB ≥2 · Không đạt |

Quy đổi thang 4 và mốc xếp loại bậc đại học theo Thông tư 08/2021. "Xếp loại môn" khác "Xếp loại GPA"
— môn thì xếp theo điểm chữ riêng nó, GPA xếp theo bình quân cả khoá; hai thang không dùng chung mốc.
Bậc phổ thông ghi `credits: 1` cho mọi môn nên trọng số bằng nhau, và không có khái niệm năm học/điểm
chữ nên ẩn hẳn các cột đó ở form lẫn bảng.

## API

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register` | — | Đăng ký, trả token + user |
| POST | `/api/auth/login` | — | Đăng nhập, trả token + user |
| GET | `/api/auth/me` | Bearer | Thông tin user của token hiện tại |
| PATCH | `/api/auth/level` | Bearer | Đặt `educationLevel` (`pho-thong` \| `dai-hoc`) |
| GET | `/api/subjects` | Bearer | Danh sách môn của user + `gpa`, `gpaScale`, `classification` |
| GET | `/api/subjects/:id` | Bearer | Chi tiết 1 môn |
| POST | `/api/subjects` | Bearer | Tạo môn mới |
| PUT | `/api/subjects/:id` | Bearer | Sửa môn |
| DELETE | `/api/subjects/:id` | Bearer | Xoá môn |
| GET | `/api/health` | — | 200 nếu DB kết nối, 503 nếu không |
| GET | `/metrics` | — | Prometheus metrics (chặn từ internet qua Nginx) |

Nhóm `/api/subjects` trả **401** khi thiếu/sai token và **409** kèm `code: LEVEL_REQUIRED` khi user
chưa chọn bậc học — client dùng mã 409 này để mở màn chọn bậc thay vì hiện bảng điểm rỗng.

Entity `Subject`: `user` (ref User), `name` (string), `credits` (1-10, phổ thông luôn 1),
`grade` (0-10, thang 10 ở cả hai bậc), `semester` (string), `academicYear` (string `YYYY`, năm bắt
đầu niên khoá, bắt buộc ở bậc đại học, không dùng ở phổ thông), `createdAt`. Response GET thêm các trường tính
sẵn: `label` (điểm chữ hoặc nhãn học lực), và riêng bậc đại học có thêm `grade4` (điểm hệ 4),
`letter` (điểm chữ), `rank` (xếp loại môn).
Entity `User`: `email` (unique), `passwordHash`, `educationLevel` (`null` cho tới khi chọn).

## Chạy local

```bash
cd server && npm install && cp .env.example .env && npm start
```

```bash
cd client && npm install && npm run dev
```

Vite dev server proxy `/api` về `localhost:5000`. Cần MongoDB chạy local hoặc sửa `MONGO_URI` trong `server/.env`.

Chạy test (75 test, không cần DB):
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
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# QUAN TRỌNG nếu dùng Prometheus/Grafana chạy container (docker/podman): container nằm trong
# network namespace riêng, DNS nội bộ (aardvark-dns/embedded DNS) và traffic tới app trên host
# đều đi qua bridge network — ufw default-deny sẽ chặn luôn cả 2 nếu không allow subnet này.
# Lấy subnet đúng bằng: podman network inspect <tên network> hoặc docker network inspect.
sudo ufw allow from 10.89.0.0/24
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
```

Kiểm chứng sau khi enable — từ trong container Prometheus phải resolve và reach được node-exporter
và app qua bridge:
```bash
podman exec prometheus wget -qO- http://node-exporter:9100/metrics | head -3
podman exec prometheus wget -qO- http://host.docker.internal:5000/api/health
```

Các cổng 27017, 3001, 9090, 9093, 9100 bind `127.0.0.1` — không tiếp cận được từ ngoài. Port 5000
(app) bind mọi interface vì Prometheus scrape từ network namespace riêng (container) không reach
được loopback của host — nhưng ufw không mở port 5000 ra ngoài, chỉ Nginx (local) và Prometheus
(qua bridge network nội bộ, `ufw allow from <subnet bridge podman>`) chạm được tới nó. Không port nào
trong nhóm này mở public.

### 4. Thư mục app + biến môi trường

```bash
sudo mkdir -p /var/www/grade-tracker /var/www/grade-tracker-api /var/log/grade-tracker
sudo chown -R $USER:$USER /var/www/grade-tracker-api /var/log/grade-tracker
```

Tạo `/var/www/grade-tracker-api/.env` (file này không bao giờ commit, deploy không ghi đè):
```
PORT=5000
MONGO_URI=mongodb://gradeapp:MẬT_KHẨU_MẠNH@127.0.0.1:27017/gradetracker?authSource=gradetracker
JWT_SECRET=<chuỗi ngẫu nhiên dài>
```

`JWT_SECRET` sinh bằng `openssl rand -base64 48`. App **không khởi động được** nếu thiếu biến này.
Đổi secret sẽ vô hiệu toàn bộ phiên đang đăng nhập (mọi người phải đăng nhập lại) — đây cũng là cách
thu hồi token nếu nghi bị lộ. Đặt quyền `chmod 600` cho file `.env`.

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
- **Xác thực + dữ liệu riêng theo tài khoản** — JWT, mật khẩu băm bcrypt, mọi truy vấn môn học lọc
  theo chủ sở hữu; thông báo đăng nhập sai không tiết lộ email nào tồn tại
