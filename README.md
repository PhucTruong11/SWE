# ☕ BrewLite

> Ứng dụng đặt cà phê không dùng tiền mặt – đặt và thanh toán chỉ trong vài chạm.

## 📋 Mô tả

BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.

**Tính năng chính:**
- 📱 Xem menu đồ uống với hình ảnh, giá cả
- ☕ Chọn size (S/M/L) và topping tùy ý
- 🛒 Quản lý giỏ hàng (thêm, sửa, xóa)
- 🔐 Đăng ký / Đăng nhập tài khoản
- 💳 Thanh toán không tiền mặt (Ví điện tử / Thẻ ngân hàng)
- 📄 Xem lịch sử đơn hàng

## 🛠 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, Zustand, React Query |
| Backend | NestJS 12, TypeScript, Prisma ORM 6, Passport JWT |
| Database | PostgreSQL 16 (Docker) |
| DevOps | Docker Compose, Git |

## 📁 Cấu trúc dự án

```
brewlite/
├── frontend/          # Next.js application (Port 3000)
├── backend/           # NestJS application (Port 3001)
├── docker/            # Docker configurations
├── PROJECT_FLOW.md    # Tài liệu kiến trúc & flow dự án
├── TEAM_WORKFLOW.md   # Phân chia nhánh Git & quy trình làm việc nhóm
└── README.md          # File này
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy chương trình

### Yêu cầu phần mềm (Prerequisites)

Đảm bảo máy tính của bạn đã cài đặt các phần mềm sau:

| Phần mềm | Phiên bản tối thiểu | Kiểm tra bằng lệnh |
|-----------|---------------------|---------------------|
| [Node.js](https://nodejs.org/) | >= 20.x | `node -v` |
| [npm](https://www.npmjs.com/) | >= 10.x | `npm -v` |
| [Docker Desktop](https://www.docker.com/) | Latest | `docker --version` |
| [Git](https://git-scm.com/) | Latest | `git --version` |

---

### Bước 1: Clone repository

```bash
git clone https://github.com/PhucTruong11/SWE.git
cd brewlite
```

> **Lưu ý:** Nếu bạn đã có code ở máy, chỉ cần `git pull origin main` để lấy bản mới nhất.

---

### Bước 2: Tạo file Environment

File `.env` chứa thông tin cấu hình (DB, JWT, Port). **Không được commit file này lên Git.**

**Trên Windows (PowerShell):**
```powershell
# Copy .env cho backend
Copy-Item backend\.env.example -Destination backend\.env

# Copy .env cho frontend
Copy-Item frontend\.env.example -Destination frontend\.env.local
```

**Trên macOS / Linux:**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

> **Nội dung mặc định `.env` backend:**
> ```
> DATABASE_URL=postgresql://brewlite:brewlite@localhost:5433/brewlite
> JWT_SECRET=brewlite-dev-jwt-secret-change-in-production
> JWT_EXPIRES_IN=7d
> PORT=3001
> FRONTEND_URL=http://localhost:3000
> ```

---

### Bước 3: Khởi động Database (PostgreSQL qua Docker)

**Mở Docker Desktop trước**, đợi nó hiện "Engine running", rồi chạy:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

Kiểm tra DB đã chạy thành công:
```bash
docker compose -f docker/docker-compose.dev.yml ps
```

Kết quả mong đợi:
```
NAME           IMAGE                STATUS              PORTS
brewlite-db    postgres:16-alpine   Up X seconds        0.0.0.0:5433->5432/tcp
```

> **Thông tin kết nối DB** (dùng cho DataGrip / DBeaver / pgAdmin):
> | Thuộc tính | Giá trị |
> |------------|---------|
> | Host | `localhost` |
> | Port | `5433` |
> | User | `brewlite` |
> | Password | `brewlite` |
> | Database | `brewlite` |

---

### Bước 4: Khởi động Backend (NestJS)

Mở **Terminal 1** trong VS Code:

```bash
cd backend

# Cài dependencies (chạy lần đầu hoặc khi có thay đổi package.json)
npm install

# Đồng bộ Prisma Schema vào Database
npx prisma db push

# Seed dữ liệu mẫu (23 sản phẩm + 15 toppings)
npx prisma db seed

# Khởi động server (tự động reload khi code thay đổi)
npm run start:dev
```

✅ **Thành công khi thấy:**
```
[NestApplication] Nest application successfully started
🚀 BrewLite API is running on: http://localhost:3001/api
```

---

### Bước 5: Khởi động Frontend (Next.js)

Mở **Terminal 2** trong VS Code (bấm nút `+`):

```bash
cd frontend

# Cài dependencies (chạy lần đầu hoặc khi có thay đổi package.json)
npm install

# Khởi động giao diện
npm run dev
```

✅ **Thành công khi thấy:**
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

---

### Bước 6: Kiểm tra hệ thống hoạt động

Mở trình duyệt và truy cập các URL sau:

| URL | Kết quả mong đợi |
|-----|-------------------|
| `http://localhost:3000` | Giao diện trang chủ Next.js |
| `http://localhost:3001/api` | Hiện "Hello World!" |
| `http://localhost:3001/api/products` | JSON danh sách 23 sản phẩm kèm giá theo size |
| `http://localhost:3001/api/products?category=phin` | Chỉ hiện 3 sản phẩm Cà Phê Phin |
| `http://localhost:3001/api/products/toppings` | JSON danh sách 15 toppings |

---

## 🔄 Hướng dẫn Chạy lại (Các lần tiếp theo)

Khi đã setup xong lần đầu, từ lần sau bạn chỉ cần **3 bước**:

```bash
# 1. Bật Docker Desktop (nếu chưa mở)

# 2. Khởi động Database
docker compose -f docker/docker-compose.dev.yml up -d

# 3. Chạy Backend (Terminal 1)
cd backend && npm run start:dev

# 4. Chạy Frontend (Terminal 2)
cd frontend && npm run dev
```

> **Không cần** chạy lại `npm install`, `prisma db push`, hay `prisma db seed` nếu không có ai thay đổi schema hoặc package.json.

---

## ⚠️ Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
|-----|-------------|----------------|
| `Error: P1000: Authentication failed` | Docker chưa chạy hoặc port bị chiếm | Mở Docker Desktop, kiểm tra `docker ps` |
| `Cannot find module` | Chưa cài dependencies | Chạy `npm install` trong thư mục tương ứng |
| `EADDRINUSE: port 3001` | Backend đang chạy ở terminal khác | Tắt terminal cũ hoặc đổi PORT trong `.env` |
| `cd backend` báo lỗi "not exist" | Đang đứng sai thư mục | Kiểm tra bạn đang ở thư mục `brewlite/` |
| Prisma báo lỗi `P1001: Can't reach database` | DB container chưa sẵn sàng | Đợi 5 giây rồi thử lại |

---

## 🐳 Chạy toàn bộ bằng Docker (Sprint 3)

```bash
docker compose -f docker/docker-compose.yml up -d
```

## 📖 Tài liệu dự án

| Tài liệu | Nội dung |
|-----------|----------|
| [PROJECT_FLOW.md](./PROJECT_FLOW.md) | Kiến trúc, ERD (7 bảng), API Spec, State Machine, Sprint Planning, Non-functional |
| [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md) | Phân chia 7 nhánh Git cho 7 thành viên, quy trình làm việc hàng ngày |

## 👥 Nhóm phát triển

| STT | Họ tên | MSSV | Vai trò |
|-----|--------|------|---------|
| 1 | | | Product Owner |
| 2 | | | Scrum Master |
| 3 | | | Developer |
| 4 | | | Developer |
| 5 | | | Developer |
| 6 | | | Developer |
| 7 | | | Developer |

## 📝 License

Bài tập lớn môn Công nghệ Phần mềm – Trường Đại học Sài Gòn – HK1 2026-2027
