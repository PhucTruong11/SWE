# BrewLite

Ứng dụng đặt đồ uống và thanh toán mô phỏng, phát triển trong môn Công nghệ Phần mềm, học kỳ I năm học 2026–2027 tại Trường Đại học Sài Gòn.

Khách hàng có thể xem menu, chọn size và topping, quản lý giỏ, thanh toán và theo dõi đơn nhận tại quầy. Dự án đang hoàn thiện Assignment 1 và chuẩn bị các yêu cầu của Assignment 2.

![Công nghệ, logo và luồng kết nối BrewLite](docs/assets/tech-stack-flow.svg)

Sơ đồ công nghệ thể hiện các thành phần đang dùng và đường kết nối runtime/CI. Logo vector được nhúng trong SVG, nguồn [Simple Icons](https://github.com/simple-icons/simple-icons).

## 1. Hiện trạng dự án

Cập nhật theo mã nguồn ngày 22/10/2026. “Đã có” nghĩa là đã có mã nguồn hoặc cấu hình, không đồng nghĩa đã nghiệm thu đầy đủ.

| Hạng mục | Hiện trạng |
| --- | --- |
| Menu, chi tiết sản phẩm, size và topping | Đã có giao diện, API và dữ liệu seed |
| Giỏ hàng | Đã có gộp/tách theo sản phẩm, size, số phần topping và tính lại voucher khi thay đổi giỏ |
| Tài khoản | Đã có đăng ký, xác minh email, đăng nhập và cookie JWT; luồng khách/tài khoản cần hoàn thiện |
| Đơn hàng, thanh toán, lịch sử | Đã có; thanh toán là mô phỏng trong backend |
| Admin | Đã có quản lý đơn, kho và khuyến mãi; chưa hoàn thiện phân quyền theo vai trò |
| Kiểm thử | Có unit test trạng thái đơn và các test mẫu; chưa đủ integration/E2E theo Assignment 2 |
| CI | Có workflow cho PR vào main; thiếu test ở cả hai ứng dụng và lint backend |
| Docker | Đã có Dockerfile cho web/API và hai file Compose ghép thành web/API/PostgreSQL; build và chạy local đã kiểm tra |
| Production/CD | Chưa có cấu hình CD và URL production được xác nhận trong tài liệu |
| Tài liệu Assignment 2 | Đã tạo khung docs; nội dung Task 1–3, truy vết và vận hành cần bổ sung |

Các vấn đề cần xử lý trước khi nghiệm thu gồm xác thực/chủ sở hữu đơn, quyền admin, idempotency khi gửi đồng thời, đồng bộ voucher và gia hạn thanh toán. Xem [luồng hệ thống](PROJECT_FLOW.md) và [kế hoạch Assignment 2](ASSIGNMENT2_PLAN.md).

![Luồng hệ thống BrewLite hiện tại: khách, đăng nhập, giỏ, checkout và theo dõi đơn](docs/assets/system-flow-current.svg)

Sơ đồ thể hiện luồng đang có, gồm nhánh khách chưa đăng nhập, gộp giỏ sau login, tạo/thanh toán đơn, xác nhận, thử lại và hết hạn. Các điểm API/quyền còn thiếu được ghi trực tiếp trên hình.

## 2. Công nghệ

| Thành phần | Công nghệ trong repository |
| --- | --- |
| Frontend | Next.js 16.4.2, React 19, TypeScript, Tailwind CSS 4 |
| Trạng thái giao diện | Zustand cho giỏ hàng; TanStack Query cho dữ liệu API |
| Backend | NestJS 12, TypeScript, Prisma 6 |
| Xác thực và validate | Passport JWT, cookie HttpOnly, bcrypt, class-validator |
| Dữ liệu | PostgreSQL 16 |
| Kiểm tra mã nguồn | ESLint ở frontend; Oxlint và Vitest ở backend |
| Công cụ dự án | Git, GitHub Actions, Docker Compose |

## 3. Cấu trúc hiện tại

Các lệnh trong tài liệu sử dụng cấu trúc đang có, chưa giả định đã chuyển sang apps/web và apps/api.

~~~text
brewlite/
|-- frontend/                 # Next.js, mặc định cổng 3000
|   |-- Dockerfile            # Build image web
|-- backend/
|   |-- Dockerfile            # Build image API
|   |-- src/                  # NestJS, mặc định cổng 3001
|   |-- prisma/               # Schema và seed
|   |-- test/                 # Test HTTP mẫu
|   |-- scripts/              # Script kiểm tra thanh toán
|-- docker/
|   |-- docker-compose.dev.yml
|   |-- docker-compose.app.yml # API và web; ghép với file DB
|   |-- README.md             # Build, vận hành và kiểm tra Docker
|-- docs/
|   |-- assets/               # SVG minh họa cho ba tài liệu tổng quan
|   |-- requirements/         # Cần bổ sung nội dung Task 1
|   |-- diagrams/             # Cần bổ sung sơ đồ Task 2–3
|   |-- architecture/         # Cần bổ sung kiến trúc và ADR
|   |-- traceability-matrix.md # Hiện là khung rỗng
|   |-- deployment.md         # Hiện là khung rỗng
|-- tests/                    # Dự kiến cho integration/E2E
|-- .github/workflows/ci.yml
|-- .env.example
|-- PROJECT_FLOW.md
|-- ASSIGNMENT2_PLAN.md
|-- README.md
~~~

Assignment 2 yêu cầu apps/web, apps/api, docs và Compose chạy đủ ba dịch vụ. Việc chuyển thư mục, hoàn thiện tài liệu và cập nhật các đường dẫn được lập kế hoạch trong [ASSIGNMENT2_PLAN.md](ASSIGNMENT2_PLAN.md); chưa thực hiện bằng lần cập nhật tài liệu này.

## 4. Chạy ứng dụng ở local

### 4.1. Chuẩn bị

- Node.js 22 và npm 10 (theo hai Dockerfile), cùng Git. Khi chạy trực tiếp trên máy, dùng phiên bản Node tương thích với dependency hiện tại.
- Docker Desktop đang chạy, có Docker Compose.
- Cổng 3000, 3001 và 5433 chưa bị ứng dụng khác sử dụng.
- Kết nối mạng để cài package; frontend hiện dùng next/font để tải Geist từ Google khi build.

~~~powershell
git clone https://github.com/PhucTruong11/SWE.git brewlite
cd brewlite
~~~

Thư mục gốc là thư mục chứa frontend, backend và docker, bất kể tên thư mục clone trên máy.

### 4.2. Cấu hình môi trường

Tạo backend/.env với các biến sau; nếu file đã tồn tại thì cập nhật các giá trị cần thiết.

~~~dotenv
DATABASE_URL=postgresql://brewlite:brewlite@localhost:5433/brewlite
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=replace-with-a-long-random-local-secret
~~~

Tạo frontend/.env.local:

~~~dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api
~~~

Code hiện đọc backend/.env và frontend/.env.local riêng. Repository chưa có backend/.env.example hoặc frontend/.env.example. File .env.example ở gốc cần được đồng bộ: Compose đang mở cổng 5433 trên máy host, và backend đọc PORT thay vì BACKEND_PORT. JWT hiện có thời hạn 7 ngày trong AuthModule, chưa đọc JWT_EXPIRES_IN từ file mẫu.

Để đăng ký và nhận OTP qua email, bổ sung MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD và MAIL_FROM vào backend/.env theo tài khoản SMTP của nhóm. Không commit file môi trường hay thông tin SMTP thật.

### 4.3. Khởi động PostgreSQL

Các lệnh dưới đây dành cho PowerShell trên máy hiện tại. Khi clone ở vị trí khác, thay đường dẫn trong `Set-Location`.

Kiểm tra BrewLite DB:

~~~powershell
Set-Location 'D:\Dev\Subject_Uni\SWE\brewlite'
docker compose -f .\docker\docker-compose.dev.yml ps
~~~

Tắt BrewLite DB khi không sử dụng:

~~~powershell
Set-Location 'D:\Dev\Subject_Uni\SWE\brewlite'
docker compose -f .\docker\docker-compose.dev.yml stop db
~~~

Bật BrewLite DB:

~~~powershell
Set-Location 'D:\Dev\Subject_Uni\SWE\brewlite'
docker compose -f .\docker\docker-compose.dev.yml up -d db
~~~

Compose ánh xạ localhost:5433 đến cổng 5432 bên trong container. Dữ liệu được giữ trong volume `docker_brewlite_pgdata`.

`stop db` giữ container và dữ liệu; `up -d db` bật lại hoặc tạo container nếu chưa có. Nếu cần xem cả container đã dừng, thêm `-a` vào lệnh `ps`. Backend cần DB đang chạy để đăng nhập, tải menu và xử lý đơn.

PostgreSQL dev có trần 512 MiB RAM, 0,5 CPU, tối đa 256 PID và log rotation 10 MB × 3. Cùng volume này được dùng khi ghép thêm frontend/backend vào Compose. Kiểm tra bằng `docker stats brewlite-db`; không chạy `down -v` nếu cần giữ dữ liệu.

Trên máy dùng chung Docker Desktop với Airflow LaplapTech, database này và dashboard LaplapTech đều là service tùy chọn trong ngân sách 8 GiB. Khi cần mở dashboard, dừng database BrewLite sau khi backend đã ngắt kết nối; khi làm BrewLite, giữ dashboard tắt. Kiểm tra ngân sách bằng `D:/Dev/Project/airflow-platform/check_resources.py` nếu có platform local này.

### 4.4. Cài backend và chuẩn bị database

Mở terminal tại thư mục gốc:

~~~powershell
cd backend
npm ci
npx prisma generate
npx prisma db push
~~~

Dự án hiện chưa có lịch sử migration. db push đang phục vụ phát triển local; quy trình migrate dev/migrate deploy sẽ được hoàn thiện trong Task 5.

Chỉ với database phát triển mới hoặc dữ liệu có thể bỏ, chạy seed:

~~~powershell
npx prisma db seed
~~~

Seed hiện xóa dữ liệu cũ trước khi tạo menu, topping, user thử, đơn và voucher mẫu. Không chạy trên database cần giữ dữ liệu và không tự động chạy lại khi khởi động production.

User test@brewlite.com trong seed có password hash placeholder, không phải tài khoản demo có mật khẩu đăng nhập hợp lệ. Để kiểm tra đăng nhập, đăng ký và xác minh một tài khoản riêng qua giao diện.

Sau đó chạy backend:

~~~powershell
npm run start:dev
~~~

API: [http://localhost:3001/api](http://localhost:3001/api). Kiểm tra menu bằng [GET /api/products](http://localhost:3001/api/products). Endpoint gốc trả lời đơn giản, chưa có health endpoint kiểm tra database.

### 4.5. Khởi động frontend

Mở terminal khác tại thư mục gốc:

~~~powershell
cd frontend
npm ci
npm run dev
~~~

Ứng dụng: [http://localhost:3000](http://localhost:3000).

Nếu chạy web và API trực tiếp bằng Node, chỉ dùng Compose cho DB như phần 4.3. Không bật đồng thời container web/API vì sẽ tranh cổng 3000/3001.

### 4.6. Chạy toàn bộ hệ thống bằng Docker Compose

Sau khi thay đổi đã được commit, push và merge vào `main`, mỗi thành viên chạy `git switch main` rồi `git pull origin main` trong repository của mình. Docker image và dữ liệu DB không được chia sẻ qua Git, nên mỗi máy tự build image và chuẩn bị DB. Tạo `backend/.env` theo phần 4.2, bật Docker Desktop và dừng web/API đang chạy trực tiếp bằng Node.

Mở PowerShell **tại thư mục gốc `brewlite`** (thư mục chứa `frontend`, `backend`, `docker`), rồi chạy đúng thứ tự sau. Các lệnh này trùng với phần 1–2 của [hướng dẫn Docker](docker/README.md):

~~~powershell
$brewCompose = @('-f', '.\docker\docker-compose.dev.yml', '-f', '.\docker\docker-compose.app.yml')
docker compose @brewCompose config --quiet
docker compose @brewCompose config --services
docker compose @brewCompose build api
docker compose @brewCompose build web
docker compose @brewCompose up -d --wait db
~~~

**Chỉ trên DB mới** (lần đầu chạy trên máy đó), tạo bảng và nạp dữ liệu mẫu:

~~~powershell
docker compose @brewCompose run --rm --no-deps api npx prisma db push
docker compose @brewCompose run --rm --no-deps api npx prisma db seed
~~~

`seed` xóa dữ liệu cũ; bỏ qua cả hai lệnh này khi DB đã có schema và dữ liệu cần giữ. Cuối cùng, bật đủ ba dịch vụ:

~~~powershell
docker compose @brewCompose up -d --wait
docker compose @brewCompose ps
~~~

Compose đặt `DATABASE_URL` nội bộ là `db:5432`; frontend dùng `/api` và Next.js chuyển tiếp đến `api:3001`. Truy cập [http://localhost:3000](http://localhost:3000) và kiểm tra [menu qua proxy](http://localhost:3000/api/products). Sau các lần pull code tiếp theo, build lại image có code thay đổi rồi chạy `docker compose @brewCompose up -d --wait`; không seed lại.

Đã xác nhận build image API và khởi động cả ba dịch vụ ở local ngày 22/10/2026. Các lệnh build lại từng image, xem log, dừng/bật và xử lý lỗi thường gặp nằm trong [docker/README.md](docker/README.md).

## 5. Lệnh kiểm tra đang có

Chạy lệnh trong đúng thư mục ứng dụng.

| Thư mục | Lệnh | Mục đích và giới hạn |
| --- | --- | --- |
| frontend | npm run lint | Kiểm tra mã frontend |
| frontend | npx tsc --noEmit | Kiểm tra kiểu TypeScript |
| frontend | npm run build | Tạo production build; cần tải được font Google |
| backend | npm run lint | Kiểm tra mã backend bằng Oxlint |
| backend | npm test | Chạy unit test hiện có |
| backend | npm run test:e2e | Chạy test HTTP mẫu, chưa phải luồng menu đến xác nhận đơn |
| backend | npm run test:payment | Script gọi API và ghi dữ liệu thanh toán vào DB đang cấu hình |
| backend | npm run build | Biên dịch backend |

Frontend chưa có lệnh npm test. Script test:payment cần backend và database thử đang chạy; các nhánh báo FAIL hiện chủ yếu ghi console nên chưa đủ làm quality gate của CI. Không dùng script này với dữ liệu thật.

Nếu lint đọc cả output .next-e2e/coverage, cần chuẩn hóa ignore hoặc phạm vi lint. Nếu build bị lỗi mạng tải font hoặc lỗi Turbopack, ghi nhận log và kiểm tra nguyên nhân riêng, không đánh dấu build đạt chỉ vì TypeScript đã qua.

## 6. CI, Docker và triển khai

[CI hiện tại](.github/workflows/ci.yml) chạy khi mở/cập nhật PR vào main:

- Backend: install, generate Prisma client, build.
- Frontend: install, lint, build.

Task 4 còn yêu cầu unit test cho cả hai ứng dụng, lint backend và required checks để chặn merge khi lint/test/build thất bại. Workflow hiện dùng Node 22 và `npm ci`, cùng phiên bản Node chính và cách cài dependency với Dockerfile. Cấu hình branch protection, issue board và lịch sử chạy trên GitHub cần được xác minh riêng.

Assignment 1 đã yêu cầu Compose chạy web/API/DB ở Task 9 và test nghiệp vụ ở Task 10. Compose local đã chạy được, nhưng Assignment 2 vẫn cần migration, health endpoint chuyên dụng, integration/E2E và CD. Kiểm thử lại trên container, rồi phát hành khi các kiểm tra bắt buộc đạt. Sau deploy vẫn phải chạy smoke test.

Đã có [mẫu CI](.github/workflows/ci.yml.example), [mẫu CD](.github/workflows/cd.yml.example) và [hướng dẫn bổ sung/kích hoạt](.github/CI_CD_GUIDE.md). Các file `.yml.example` chưa chạy trên GitHub Actions; hoàn thành test frontend, Docker và cấu hình triển khai theo hướng dẫn trước khi bật từng workflow.

Chưa có URL production hoặc hướng dẫn rollback đã được kiểm chứng. Những thông tin này sẽ được cập nhật vào [docs/deployment.md](docs/deployment.md) sau khi nhóm chọn nền tảng và triển khai thực tế.

## 7. Tài liệu

| Tài liệu | Nội dung |
| --- | --- |
| [PROJECT_FLOW.md](PROJECT_FLOW.md) | Kiến trúc, dữ liệu, API, luồng nghiệp vụ và giới hạn hiện tại |
| [ASSIGNMENT2_PLAN.md](ASSIGNMENT2_PLAN.md) | Công việc, tiêu chí nghiệm thu và minh chứng Task 4–5 |
| [Assignment2-BrewLite.pdf](Assignment2-BrewLite.pdf) | Đề Assignment 2, nguồn yêu cầu nghiệm thu |
| [BrewLite-CongNghePhanMem.pdf](BrewLite-CongNghePhanMem.pdf) | Đề Assignment 1 |
| [TEAM_WORKFLOW.md](TEAM_WORKFLOW.md) | Hướng dẫn phối hợp Git của nhóm; cần đồng bộ khi đổi cấu trúc |
| [docker/README.md](docker/README.md) | Build, chạy, kiểm tra và quản lý DB/web/API bằng Compose |
| [Schema Prisma](backend/prisma/schema.prisma) | Mô hình dữ liệu đang triển khai |
| [docs/](docs/) | Nơi hoàn thiện tạo phẩm yêu cầu, thiết kế, truy vết và vận hành |

Các SVG trong docs/assets chỉ minh họa tài liệu tổng quan, chưa thay thế bộ sơ đồ UML và tệp nguồn bắt buộc của Task 2–3.
