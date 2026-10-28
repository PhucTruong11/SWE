# BrewLite: quy trình làm việc nhóm

Cập nhật: 28/10/2026. Remote `origin` của checkout này là [PhucTruong11/brewlite](https://github.com/PhucTruong11/brewlite). Tài liệu này dành cho thành viên làm việc trên repo đó, không phải hướng dẫn tạo repository mới.

## 1. Lấy bản mới

Sau khi PR đã merge vào `main`, lưu hoặc commit thay đổi đang làm trước. Tại thư mục `brewlite` trong bản clone trên máy mình:

```powershell
git status --short
git switch main
git pull origin main
```

Nếu đang làm trên nhánh tính năng, trở lại nhánh đó và merge/rebase `main` theo quy ước nhóm; giải quyết conflict rồi mới tiếp tục. Không chạy `git reset --hard` để xử lý conflict khi còn file chưa lưu. Để chạy bản mới bằng Docker, làm theo [README gốc, mục thành viên đã có DB](README.md) hoặc [docker/README.md](docker/README.md); image và volume DB của từng máy không được Git đồng bộ.

## 2. Cập nhật DB và container

Trong PowerShell tại `brewlite`, sau khi đã pull code:

```powershell
$brewCompose = @('-f', '.\docker\docker-compose.dev.yml', '-f', '.\docker\docker-compose.app.yml')
docker compose @brewCompose config --quiet
docker compose @brewCompose up -d --wait db
docker compose @brewCompose build api
docker compose @brewCompose run --rm --no-deps api npx prisma migrate deploy
docker compose @brewCompose run --rm --no-deps api npx prisma migrate status
docker compose @brewCompose build web
docker compose @brewCompose up -d --wait
docker compose @brewCompose ps
```

Máy đã có DB cũ nhưng chưa có lịch sử Prisma Migrate cần **baseline một lần** theo [docker/README.md](docker/README.md) trước khi `migrate deploy`. Nếu DB chưa có nguyên liệu/công thức, chạy `npm run catalog:bootstrap` qua Compose một lần sau migration; với DB demo có thể nạp tồn mẫu bằng `inventory:demo-stock`. Không chạy lại `db seed`, `db push` hoặc `down -v` trên DB muốn giữ. `backend/.env` và volume DB là cấu hình/dữ liệu riêng từng máy.

## 3. Gửi thay đổi

Mỗi thành viên làm trên nhánh tính năng của mình, kiểm tra `git diff` và `git status`, rồi chạy bước lint/build/test phù hợp trong [README gốc](README.md). Chỉ stage file của task mình; không commit `.env`, dữ liệu DB hoặc output build. Push nhánh và mở PR vào `main`. CI hiện tại kiểm tra backend và frontend bằng `npm ci`, lint, build, unit test; CI đạt chưa thay thế bước test API/DB và giao diện cho tính năng vừa làm.

Các thay đổi schema phải đi cùng migration, hướng dẫn chuyển dữ liệu và kiểm tra trên DB thử. Khi thay đổi API hoặc luồng người dùng, cập nhật [PROJECT_FLOW.md](PROJECT_FLOW.md) và README liên quan trong cùng PR.
