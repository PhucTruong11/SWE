# BrewLite

Ứng dụng đặt đồ uống và thanh toán mô phỏng, phát triển trong môn Công nghệ Phần mềm, học kỳ I năm học 2026–2027 tại Trường Đại học Sài Gòn.

Khách hàng có thể xem menu, chọn size và topping, quản lý giỏ, thanh toán và theo dõi đơn nhận tại quầy. Dự án đang hoàn thiện Assignment 1 và chuẩn bị các yêu cầu của Assignment 2.

![Công nghệ, logo và luồng kết nối BrewLite](docs/assets/tech-stack-flow.svg)

Sơ đồ công nghệ thể hiện các thành phần đang dùng và đường kết nối runtime/CI. Logo vector được nhúng trong SVG, nguồn [Simple Icons](https://github.com/simple-icons/simple-icons).

## 1. Hiện trạng dự án

Cập nhật theo mã nguồn ngày 28/10/2026. “Đã có” nghĩa là đã có mã nguồn hoặc cấu hình, không đồng nghĩa đã nghiệm thu đầy đủ.

| Hạng mục | Hiện trạng |
| --- | --- |
| Menu, chi tiết sản phẩm, size và topping | Chỉ bật 6 món và 3 topping; trạng thái có thể bán tính theo công thức và nguyên liệu |
| Giỏ hàng | Gộp/tách theo món, size, topping; gọi `POST /api/cart/validate` để đối chiếu cả giỏ với giá và nguyên liệu trong DB |
| Tài khoản | Có đăng ký, xác minh email, đăng nhập và cookie JWT; route admin kiểm tra vai trò ADMIN |
| Đơn hàng, thanh toán, lịch sử | Tạo đơn giữ nguyên liệu 2 phút; xác nhận thanh toán mô phỏng mới trừ tồn thực; có một cơ hội tạo lại đơn khi hết hạn |
| Admin | Có quản lý đơn và voucher; hai trang Nguyên liệu/Công thức đã đọc dữ liệu thật, API tạo/sửa/nhập hàng/lưu công thức còn chờ triển khai |
| Kiểm thử | Unit test frontend/backend và integration test nguyên liệu trên DB thử riêng đã có; browser E2E vẫn chưa hoàn thiện |
| CI | Workflow PR vào main chạy `npm ci`, Prisma generate, lint, build và unit test ở cả hai ứng dụng; chưa bật integration/E2E và required checks |
| Docker | Đã có Dockerfile cho web/API và hai file Compose ghép thành web/API/PostgreSQL; build và chạy local đã kiểm tra |
| Production/CD | Chưa có cấu hình CD và URL production được xác nhận trong tài liệu |
| Tài liệu Assignment 2 | Đã tạo khung docs; nội dung Task 1–3, truy vết và vận hành cần bổ sung |

Các việc còn lại gồm API ghi cho Nguyên liệu/Công thức, kiểm thử browser E2E, xác minh CI trên GitHub và cấu hình CD. Xem [luồng hệ thống](PROJECT_FLOW.md), [plan nguyên liệu](INVENTORY_RECIPE_PLAN.md) và [kế hoạch Assignment 2](ASSIGNMENT2_PLAN.md).

![Luồng hệ thống BrewLite hiện tại: khách, đăng nhập, giỏ, checkout và theo dõi đơn](docs/assets/system-flow-current.svg)

Sơ đồ SVG này được vẽ trước đợt chuyển sang tồn nguyên liệu. Luồng mới và các trạng thái nguồn chuẩn nằm trong [PROJECT_FLOW.md](PROJECT_FLOW.md); không dùng các nhãn stock/thời hạn trên hình làm đặc tả hiện tại.

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
|-- tests/                    # Bộ request API; integration nguyên liệu chạy trong backend/scripts
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
git clone https://github.com/PhucTruong11/brewlite.git brewlite
cd brewlite
~~~

Remote `origin` của checkout hiện tại là `PhucTruong11/brewlite.git`. Thư mục gốc là thư mục chứa frontend, backend và docker, bất kể tên thư mục clone trên máy; đường dẫn `D:\Dev\Subject_Uni\SWE\brewlite` chỉ là vị trí trên máy đang phát triển.

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
~~~

Migration đã được lưu trong `backend/prisma/migrations`. **DB mới chưa có bảng:** tạo schema và dữ liệu demo theo thứ tự:

~~~powershell
npx prisma migrate deploy
npx prisma db seed
npm run catalog:bootstrap
npm run inventory:demo-stock
~~~

**DB cũ có bảng/dữ liệu nhưng chưa có lịch sử Prisma Migrate:** sao lưu DB, rồi chạy theo thứ tự; `resolve` chỉ cần một lần:

~~~powershell
npx prisma migrate resolve --applied 20261027000100_baseline
npx prisma migrate deploy
npm run catalog:bootstrap
~~~

Nếu DB đã có baseline, bỏ lệnh `resolve`. Seed chỉ chạy trên DB trống và tạo đúng 6 món, 3 topping; **không chạy `db seed` trên DB đang dùng**. Migration `20261029000100_prune_legacy_catalog` xóa các món/topping cũ sau khi lưu tên và ảnh món vào lịch sử đơn, nên sao lưu DB trước khi áp. `catalog:bootstrap` tạo nguyên liệu/công thức và bật bán 6 món, 3 topping, không xóa đơn hoặc reset tồn cũ. Giỏ và checkout hiện kiểm tra nguyên liệu; tạo đơn giữ kho 2 phút, thanh toán thành công mới trừ tồn thực. `inventory:demo-stock` chỉ dành cho DB demo local: nó nạp lượng mẫu vào nguyên liệu đang có tồn bằng 0, không ghi đè số lượng khác 0. Có thể bỏ lệnh này nếu sẽ nhập tồn thực tế ở bước admin tiếp theo. Định lượng mẫu nằm trong [plan nguyên liệu](INVENTORY_RECIPE_PLAN.md).

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

**DB mới, chưa có bảng:** tạo schema, dữ liệu demo rồi bật danh mục/công thức:

~~~powershell
docker compose @brewCompose run --rm --no-deps api npx prisma migrate deploy
docker compose @brewCompose run --rm --no-deps api npx prisma db seed
docker compose @brewCompose run --rm --no-deps api npm run catalog:bootstrap
docker compose @brewCompose run --rm --no-deps api npm run inventory:demo-stock
~~~

**DB cũ có dữ liệu và chưa từng dùng Prisma Migrate:** sao lưu DB, đánh dấu baseline một lần, sau đó áp migration và nạp danh mục. **Không chạy `db seed`**:

~~~powershell
docker compose @brewCompose run --rm --no-deps api npx prisma migrate resolve --applied 20261027000100_baseline
docker compose @brewCompose run --rm --no-deps api npx prisma migrate deploy
docker compose @brewCompose run --rm --no-deps api npm run catalog:bootstrap
~~~

Nếu baseline đã được ghi, bỏ lệnh `resolve`; sau lần đầu chỉ cần `migrate deploy` khi pull code có migration mới. Cuối cùng, bật đủ ba dịch vụ:

~~~powershell
docker compose @brewCompose up -d --wait
docker compose @brewCompose ps
~~~

Compose đặt `DATABASE_URL` nội bộ là `db:5432`; frontend dùng `/api` và Next.js chuyển tiếp đến `api:3001`. Truy cập [http://localhost:3000](http://localhost:3000) và kiểm tra [menu qua proxy](http://localhost:3000/api/products). Sau các lần pull code tiếp theo, build lại image có code thay đổi, chạy `migrate deploy` nếu có migration mới rồi `docker compose @brewCompose up -d --wait`; không seed lại.

### 4.7. Thành viên đã có DB: cập nhật sau khi pull

Chỉ chạy sau khi phần thay đổi này đã được merge vào nhánh mà thành viên sẽ pull. Mở PowerShell ở thư mục gốc của bản clone **trên máy mình**; không copy nguyên đường dẫn `D:\...` của máy khác. Giữ `backend/.env` hiện có và Docker volume hiện có; không chạy `db seed`, `db push`, `down -v` hoặc `migrate resolve` lần nữa.

~~~powershell
git switch main
git pull origin main
$brewCompose = @('-f', '.\docker\docker-compose.dev.yml', '-f', '.\docker\docker-compose.app.yml')
docker compose @brewCompose config --quiet
docker compose @brewCompose up -d --wait db
docker compose @brewCompose build api
docker compose @brewCompose run --rm --no-deps api npx prisma migrate deploy
docker compose @brewCompose run --rm --no-deps api npx prisma migrate status
docker compose @brewCompose build web
docker compose @brewCompose up -d --wait
docker compose @brewCompose ps
~~~

`catalog:bootstrap` chỉ cần chạy **một lần** sau khi áp migration nguyên liệu vào DB chưa có danh mục mới. Chạy lại sẽ bật lại đúng 6 món/3 topping mẫu, dù không đặt lại tồn hoặc công thức đã có. **Chỉ dùng** `inventory:demo-stock` cho DB demo cần nạp mẫu ở nguyên liệu đang bằng 0. Nếu `migrate status` cho thấy DB cũ có bảng nhưng chưa có lịch sử migration, dừng tại đó và làm theo nhánh “DB cũ” ở [hướng dẫn Docker](docker/README.md); không tự chạy seed hay resolve trên DB chưa xác minh. Sau khi khởi động, đăng nhập ADMIN và mở `/admin/ingredients`, `/admin/recipes`; giao diện đã gọi API ghi, nhưng backend hiện mới có GET nên thao tác tạo/sửa/nhập kho/lưu công thức chưa hoạt động.

Nếu đây là **lần đầu** DB của thành viên chuyển sang công thức nguyên liệu, chạy thêm sau `migrate deploy` (trước `up -d --wait`):

~~~powershell
docker compose @brewCompose run --rm --no-deps api npm run catalog:bootstrap
docker compose @brewCompose run --rm --no-deps api npm run inventory:demo-stock
~~~

Lệnh nạp tồn chỉ dùng cho DB demo: nó thêm số lượng mẫu vào nguyên liệu có tồn bằng 0. Bỏ dòng thứ hai nếu số 0 là trạng thái hết nguyên liệu có chủ ý.

Đã xác nhận build hai image, chạy ba dịch vụ và kiểm tra API chỉ đọc của hai trang admin ở local ngày 28/10/2026. Các lệnh build lại từng image, xem log, dừng/bật và xử lý lỗi thường gặp nằm trong [docker/README.md](docker/README.md).

## 5. Lệnh kiểm tra đang có

Chạy lệnh trong đúng thư mục ứng dụng.

| Thư mục | Lệnh | Mục đích và giới hạn |
| --- | --- | --- |
| frontend | npm run lint | Kiểm tra mã frontend |
| frontend | npx tsc --noEmit | Kiểm tra kiểu TypeScript |
| frontend | npm run build | Tạo production build; cần tải được font Google |
| frontend | npm test | Unit test giỏ hàng và các hàm liên quan |
| backend | npm run lint | Kiểm tra mã backend bằng Oxlint |
| backend | npm test | Chạy unit test hiện có |
| backend | npm run test:ingredients | Kiểm thử tích hợp giỏ → đơn → giữ/trừ/trả nguyên liệu → thanh toán trên DB thử riêng |
| backend | npm run test:e2e | Chạy test HTTP mẫu, chưa phải luồng menu đến xác nhận đơn |
| backend | npm run test:payment | Script payment cũ gọi API và ghi dữ liệu vào DB đang cấu hình; chỉ dùng với DB thử |
| backend | npm run build | Biên dịch backend |

Để chạy `test:ingredients`, tạo database thử **riêng** trong PostgreSQL local một lần, rồi chạy các lệnh dưới đây trong `backend`. Lệnh seed chỉ được phép chạy khi `DATABASE_URL` đang trỏ tới `brewlite_inventory_test`:

~~~powershell
docker exec brewlite-db psql -U brewlite -d postgres -c 'CREATE DATABASE brewlite_inventory_test'
Set-Location .\backend
$env:DATABASE_URL = 'postgresql://brewlite:brewlite@localhost:5433/brewlite_inventory_test'
npx prisma migrate deploy
npx prisma db seed
npm run catalog:bootstrap
npm run test:ingredients
~~~

Nếu DB thử đã tồn tại, bỏ lệnh `CREATE DATABASE`. Những lần sau chỉ cần đặt lại `DATABASE_URL` thử rồi chạy `npm run test:ingredients`. Script từ chối chạy nếu tên DB không đúng và kiểm tra thiếu nguyên liệu, hai đơn đặt đồng thời, thanh toán thất bại/thử lại, idempotency, hết hạn và hoàn kho khi hủy. Script `test:payment` cũ chưa theo luồng xác thực và nguyên liệu mới, nên dùng `test:ingredients` để kiểm thử giai đoạn này. Sau khi test, mở terminal mới hoặc xóa biến môi trường bằng `Remove-Item Env:DATABASE_URL` trước khi làm việc với DB khác.

Nếu lint đọc cả output .next-e2e/coverage, cần chuẩn hóa ignore hoặc phạm vi lint. Nếu build bị lỗi mạng tải font hoặc lỗi Turbopack, ghi nhận log và kiểm tra nguyên nhân riêng, không đánh dấu build đạt chỉ vì TypeScript đã qua.

## 6. CI, Docker và triển khai

[CI hiện tại](.github/workflows/ci.yml) chạy khi mở/cập nhật PR vào main:

- Backend: install, generate Prisma client, lint, build, unit test.
- Frontend: install, lint, build, unit test.

Task 4 vẫn cần bật required checks trong quy tắc chặn merge. Workflow hiện dùng Node 22 và `npm ci`, cùng phiên bản Node chính và cách cài dependency với Dockerfile. Cấu hình branch protection, issue board và lịch sử chạy trên GitHub cần được xác minh riêng.

Assignment 1 đã yêu cầu Compose chạy web/API/DB ở Task 9 và test nghiệp vụ ở Task 10. Compose local và migration nền cho nguyên liệu đã chạy được, nhưng Assignment 2 vẫn cần hoàn thiện quy trình migration, health endpoint chuyên dụng, integration/E2E và CD. Kiểm thử lại trên container, rồi phát hành khi các kiểm tra bắt buộc đạt. Sau deploy vẫn phải chạy smoke test.

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
