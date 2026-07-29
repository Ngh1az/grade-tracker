# Kịch bản lời nói — quay video demo

File này là để đọc/nói theo lúc quay, không phải checklist kỹ thuật.
Chữ thường = lời nói ra miệng, đọc gần như nguyên văn cũng được.
*[Chữ nghiêng trong ngoặc] = hành động tay làm lúc nói câu đó.*

Chuẩn bị trước (đã xong): 5 tab mở sẵn (web, GitHub Actions, Discord,
Grafana, VS Code), 1 terminal đã SSH VPS, biến `MONGO_APP_URI` đã set
sẵn trong `~/.bashrc` trên VPS.

---

## Cảnh 0 — Mở đầu 

*[Đứng ở trang chủ grades.nghiatech.click, đã đăng nhập, chưa click gì]*

"Chào thầy/cô, em là [tên], đây là bài final DevOps của em — hệ thống
Quản lý Môn học và Điểm số. Về mặt kỹ thuật, client em dùng React với
Vite, server là Node Express, database là MongoDB. Website chạy ở
grades.nghiatech.click, còn trang giám sát Grafana ở
grafana.nghiatech.click. Có một chỗ em xin phép đổi so với đề gốc: kênh
thông báo em dùng Discord thay vì Telegram, em đã xin phép thầy/cô
trước đó rồi."

---

## Cảnh 1 — CRUD qua HTTPS

*[Trỏ chuột vào ổ khoá cạnh URL, để popup hiện ra 1-2 giây]*

"Chứng chỉ HTTPS này là Let's Encrypt, cấp qua Certbot, và có cơ chế tự
gia hạn."

*[Click sidebar Môn học]*

"Đây là trang quản lý môn học chính của app."

*[Để trống ô Tên môn, bấm Thêm môn học]*

"Em thử bỏ trống tên môn xem sao — [chỉ dòng lỗi đỏ] — form có validate
cơ bản phía client."

*[Điền lại đầy đủ: tên "Demo Video", tín chỉ 3, điểm 8.5, chọn học kỳ +
năm học, bấm Thêm môn học]*

"Giờ điền đầy đủ và thêm thật."

*[Môn mới hiện cuối bảng, bấm nút ⋮ ở hàng đó → Sửa, đổi điểm thành 9,
bấm Cập nhật]*

"Sửa lại điểm môn này thành 9."

*[Chuyển sang tab terminal đã SSH VPS]*

"Để chứng minh phía sau là database thật chứ không phải giả, em SSH vào
VPS xem trực tiếp."

*[Gõ: `mongosh --quiet --eval 'db.getSiblingDB("gradetracker").subjects.find().limit(1)'`]*

"Em thử truy vấn không kèm thông tin đăng nhập trước — [đợi lỗi hiện ra,
đọc to] — bị từ chối ngay, lỗi 'requires authentication'. Database này
có user và mật khẩu riêng cho app."

*[Gõ: `mongosh --quiet "$MONGO_APP_URI" --eval 'db.subjects.find({ name: "Demo Video" }).pretty()'`]*

"Giờ dùng đúng thông tin đăng nhập của app — [chỉ kết quả] — đây, đúng
môn Demo Video, điểm 9, khớp y hệt em vừa sửa trên web. Mongo này chỉ
bind vào 127.0.0.1 nên cũng không mở ra internet được."

*[Quay lại tab web, bấm ⋮ → Xoá]*

"Quay lại web, xoá thử môn này — [dialog confirm hiện ra, đọc to dòng
cảnh báo] — có bước xác nhận trước khi xoá, tránh xoá nhầm."

*[Bấm Xoá môn, rồi F5 reload cả trang]*

"Reload lại trang — danh sách vẫn đúng, không có gì tự hồi phục hay mất
theo phiên, vì dữ liệu nằm ở database thật, không phải state tạm trong
bộ nhớ."

---

## Cảnh 2 — Push code, CI/CD tự deploy, Discord báo thành công

*[Chuyển qua VS Code, sửa 1 chữ nhỏ ở đâu đó hiện trên UI]*

"Em sửa một chỗ nhỏ trên giao diện để lát mình thấy web đổi thật sự."

*[Terminal, gõ lần lượt: `git add -A`, `git commit -m "demo: đổi UI nhỏ để quay video"`, `git push origin main`]*

"Commit và push thẳng lên nhánh main."

*[Chuyển ngay sang tab GitHub Actions]*

"Push vào main tự động trigger hai workflow: một cái chạy test, một cái
lo build với deploy. Mình đợi nó chạy."

*[Trong lúc job test đang chạy, khoảng 15-20 giây]*

"Job build ở đây có khai báo `needs: test`, nghĩa là nó chỉ chạy nếu job
test chạy qua hết. Nếu test fail, build với deploy không chạy luôn, đỡ
tốn công."

*[Trong lúc job build đang chạy, khoảng 30-60 giây]*

"Việc build này em để chạy trên GitHub runner chứ không phải ngay trên
VPS, vì VPS cấu hình khá yếu. Runner build xong thì đóng gói lại, gửi
xuống VPS đúng phần thành phẩm thôi, nên nhẹ và nhanh hơn nhiều."

*[Trong lúc job deploy đang chạy, khoảng 20-30 giây]*

"Job deploy này SCP file lên VPS, giải nén ra, rồi chạy `pm2 reload` —
em dùng reload chứ không phải restart, để hạn chế downtime. Xong nó tự
gọi vào `/api/health` kiểm tra. Nếu health check fail, nó tự rollback về
bản trước đó và cho cả workflow báo đỏ."

*[Đợi cả 4 job xanh: test, build, deploy, notify]*

"Xong hết rồi, xanh cả bốn job."

*[Chuyển tab web, F5]*

"Refresh lại web — [chỉ chỗ vừa sửa] — đúng chỗ em vừa đổi đã lên
production thật."

*[Chuyển tab Discord]*

"Và đây, Discord nhận được tin báo thành công ngay — có tên người push
với nội dung commit message."

---

## Cảnh 3 — Cố ý làm hỏng test, bị chặn, Discord báo lỗi

*[VS Code, mở server/tests/grade.test.js, tìm dòng khoảng số 50 có
`expect(calculateGPA(subjects, LEVEL_UNIVERSITY)).toBe(3.2);`]*

"Giờ em cố ý làm hỏng một test, để chứng minh pipeline thật sự chặn được
code lỗi chứ không phải chỉ chạy cho có."

*[Sửa 3.2 thành 999]*

"Em đổi kết quả mong đợi thành một con số sai hẳn."

*[Mở thêm 1 file UI, ví dụ đổi 1 chữ tiêu đề nào đó — làm trong CÙNG
commit với test hỏng, để lát refresh web mà không thấy chữ này thì chắc
chắn chứng minh được bản mới chưa hề lên production, không phải chỉ là
"em không để ý"]*

"Em tranh thủ đổi luôn 1 chữ trên giao diện trong cùng lần commit này —
để lát mình có cái để kiểm chứng bằng mắt là web có đổi hay không."

*[Push: `git add -A`, `git commit -m "demo: cố ý làm hỏng test"`, `git push origin main`]*

"Commit, push."

*[Sang tab Actions, chờ job test chuyển đỏ]*

"Job test chuyển đỏ ngay — và để ý job build với deploy không hề chạy,
bị bỏ qua luôn vì phụ thuộc vào test."

*[Sang tab web, F5]*

"Refresh lại web — [chỉ đúng chỗ đáng lẽ phải đổi chữ] — chữ em vừa sửa
không hề xuất hiện, vẫn là bản cũ y hệt lúc nãy. Đây là bằng chứng chứ
không phải em đoán — nếu deploy lỡ chạy thì chữ này đã lên rồi."

*[Sang Discord]*

"Discord báo lỗi ngay — [đọc to nội dung, click vào link log] — kèm
link dẫn thẳng tới log của lần chạy đó để xem chi tiết."

*[Quay lại VS Code, sửa 999 về lại 3.2, có thể giữ nguyên chữ UI vừa đổi
vì giờ test đã đúng lại, push sẽ cho lên production luôn]*

*[Push: `git add -A`, `git commit -m "fix: revert giá trị test demo"`,
`git push origin main`]*

"Em sửa lại test cho đúng và push lần nữa."

*[Đợi pipeline xanh lại, F5 web — giờ chữ vừa đổi mới thật sự lên]*

"Và giờ pipeline xanh, chữ đó mới lên web thật — càng rõ ràng hơn là lúc
nãy web chưa hề đổi."

---

## Cảnh 4 — Diễn tập sự cố: tắt app, nhận cảnh báo, bật lại

*[Chuyển sang terminal SSH VPS, gõ `pm2 status`]*

"Đây là màn hình quản lý tiến trình PM2 trên VPS — app đang chạy bình
thường, trạng thái online."

*[Gõ `pm2 stop grade-tracker-api`]*

"Giờ em chủ động tắt app để giả lập một sự cố thật."

*[Sang tab Grafana, chỉ panel app trong dashboard]*

"Bên Grafana, panel app rớt xuống 0 ngay lập tức."

*[Đợi khoảng 1.5-2 phút, tua nhanh khi dựng video — nói trong lúc chờ]*

"Alert canh app chết này em để `for: 1 phút`, nghĩa là phải mất tín hiệu
liên tục một phút mới báo, để tránh báo nhầm nếu chỉ là mạng chập chờn
vài giây. Alertmanager còn có thêm 30 giây chờ gom nhóm trước khi gửi,
nên tổng cộng khoảng một phút rưỡi tới hai phút thì tin mới tới Discord."

*[Sang Discord, chỉ tin FIRING]*

"Và đây, tin cảnh báo FIRING đã tới — [đọc to nội dung] — nội dung này
em viết sẵn lệnh cần chạy luôn, để ai trực cũng biết làm gì ngay, không
phải đoán."

*[Quay lại terminal, gõ `pm2 start grade-tracker-api` rồi `pm2 status`]*

"Em bật lại app."

*[Đợi tiếp khoảng 1-2 phút, tua nhanh]*

*[Sang Discord]*

"Và Discord nhận được tin RESOLVED, báo sự cố đã hết."

*[Sang Grafana, refresh panel]*

"Bên Grafana panel cũng lên lại mức bình thường."

---

## Cảnh 4.5 — Điểm cộng vận hành nâng cao (tuỳ chọn, ~45s)

Không bắt buộc — bỏ qua nếu video đã gần 9-10 phút. Có thì thêm điểm
cộng, giảng viên đỡ phải hỏi vấn đáp hết mấy cái này.

*[Vẫn ở terminal SSH VPS, gõ `ls -lh /var/backups/grade-tracker/`]*

"Đây là backup MongoDB — cron chạy mỗi ngày lúc 2 giờ sáng, nén gzip,
giữ 7 bản gần nhất, tự xoá bản cũ hơn."

*[Gõ `grep PasswordAuthentication /etc/ssh/sshd_config`]*

"SSH chỉ vào được bằng key, đã tắt đăng nhập bằng mật khẩu."

*[Gõ `cat /etc/nginx/conf.d/rate-limit-grade-tracker.conf`]*

"Nginx có giới hạn 10 request/giây cho `/api`, chặn được spam hoặc bot
dò tự động."

---

## Cảnh 5 — Kết

"Tóm lại, hệ thống của em có đủ năm phần: ứng dụng CRUD thật với
database, deploy trên VPS qua HTTPS với PM2 và firewall, pipeline
CI/CD tự test-build-deploy có rollback, thông báo Discord mỗi lần
deploy, và giám sát cảnh báo với Grafana. Repo, website, và tài khoản
Grafana dạng Viewer em đã gửi qua form nộp bài. Hệ thống sẽ giữ chạy
tới ít nhất ngày 8 tháng 8 để thầy/cô kiểm tra. Em cảm ơn thầy/cô đã
xem."

---

## Nếu bị hỏi thêm ngay lúc quay xong (tự tập trước)

- **Vì sao Nginx đứng trước app, không cho vào thẳng port 5000?** — App
  chỉ nghe 127.0.0.1:5000, ufw không mở port đó ra ngoài. Nginx là cửa
  duy nhất, vừa lo HTTPS, vừa reverse proxy, vừa rate limit.
- **Dòng `needs: test` làm gì?** — Job build chỉ chạy nếu job test
  thành công. Test fail thì build và deploy bị bỏ qua hoàn toàn.
- **Sao alert CPU để `for: 5 phút` chứ không báo ngay khi vượt 80%?** —
  CPU tăng vọt vài giây là chuyện bình thường, để 5 phút mới lọc được
  nhiễu, chỉ báo khi cao thật sự kéo dài.
- **MongoDB auth thế nào?** — User và mật khẩu riêng cho app, chỉ bind
  127.0.0.1, không mở ra internet.
- **Secrets nằm ở đâu?** — Toàn bộ trong GitHub Secrets, inject lúc chạy
  workflow, không nằm trong code hay file YAML.
- **Health check fail thì sao?** — Script tự rollback về bản backup
  trước đó rồi mới báo đỏ, không âm thầm để app chết.

---

## Trước khi upload

- [ ] Đủ 4 cảnh bắt buộc, có thoại rõ ràng, không im lặng click chuột
- [ ] Không lộ password thật, webhook URL đầy đủ, SSH private key, Mongo
  URI đầy đủ, nội dung file `.env`
- [ ] Tổng thời lượng 5-10 phút
- [ ] Upload xong, mở thử link ở trình duyệt ẩn danh để chắc mở được
