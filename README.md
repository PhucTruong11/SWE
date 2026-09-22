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
| Backend | NestJS 12, TypeScript, Prisma 6, Passport JWT |
| Database | PostgreSQL 16 (Docker) |
| DevOps | Docker Compose, Git |

## 📁 Cấu trúc dự án

```
brewlite/
├── frontend/          # Next.js application (Port 3000)
├── backend/           # NestJS application (Port 3001)
│   └── prisma/        # Schema + Seed data (23 sản phẩm, 15 toppings)
├── docker/            # Docker configurations
├── PROJECT_FLOW.md    # Kiến trúc, ERD (7 bảng), API, State Machine, Sprint Planning
├── TEAM_WORKFLOW.md   # Hướng dẫn Git workflow & phân chia task nhóm
└── README.md          # File này
```

## 🗄 Database (7 bảng)

| Bảng | Mô tả |
|------|-------|
| `users` | Thông tin khách hàng |
| `products` | Danh mục đồ uống (23 sản phẩm, 6 danh mục) |
| `product_prices` | Giá theo từng size S/M/L (68 mức giá) |
| `toppings` | Danh sách topping (15 loại, giá 9k–15k) |
| `orders` | Đơn hàng |
| `order_items` | Chi tiết từng món trong đơn |
| `payments` | Lịch sử thanh toán |

---

## 🚀 Hướng dẫn cài đặt & chạy (Step-by-step)

### ⚙️ Yêu cầu hệ thống

- [Node.js](https://nodejs.org/) >= 20.x
- [npm](https://www.npmjs.com/) >= 10.x
- [Docker Desktop](https://www.docker.com/) (bật Docker Engine)
- [Git](https://git-scm.com/)

### Bước 1: Clone repository

```bash
git clone https://github.com/PhucTruong11/SWE.git
cd brewlite
```

### Bước 2: Tạo file environment

```bash
# Copy .env cho backend
cp backend/.env.example backend/.env

# Copy .env cho frontend
cp frontend/.env.example frontend/.env.local
```

> **Lưu ý:** File `.env` chứa thông tin nhạy cảm (password DB, JWT secret), đã được `.gitignore` nên **không** được push lên Git.

### Bước 3: 🐳 Khởi động Database (PostgreSQL qua Docker)

**Mở Docker Desktop** trước, chờ biểu tượng cá voi hiện xanh lá (Engine running), rồi chạy:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

Kiểm tra container đang chạy:
```bash
docker compose -f docker/docker-compose.dev.yml ps
```

Kết quả mong đợi:
```
NAME          IMAGE                STATUS              PORTS
brewlite-db   postgres:16-alpine   Up (healthy)        0.0.0.0:5433->5432/tcp
```

> **⚠️ Port:** Database chạy trên port **5433** (không phải 5432 mặc định) để tránh xung đột nếu máy đã cài PostgreSQL sẵn.

### Bước 4: 🖥 Khởi động Backend (NestJS)

Mở **Terminal 1**:

```bash
cd backend

# Cài thư viện
npm install

# Đồng bộ schema lên Database (tạo các bảng)
npx prisma db push

# Seed dữ liệu mẫu (23 đồ uống + 15 toppings)
npx prisma db seed

# Khởi chạy Backend (tự động reload khi code thay đổi)
npm run start:dev
```

Kết quả mong đợi:
```
[NestApplication] Nest application successfully started
🚀 BrewLite API is running on: http://localhost:3001/api
```

### Bước 5: 🎨 Khởi động Frontend (Next.js)

Mở **Terminal 2** (bấm nút `+` trong VS Code terminal):

```bash
cd frontend

# Cài thư viện
npm install

# Khởi chạy Frontend
npm run dev
```

Kết quả mong đợi:
```
▲ Next.js 16.x
- Local: http://localhost:3000
```

---

## ✅ Kiểm tra hệ thống hoạt động

Sau khi cả 3 service (Docker DB + Backend + Frontend) đều chạy, mở trình duyệt:

| URL | Kỳ vọng |
|-----|---------|
| `http://localhost:3001/api` | Hiện "Hello World!" |
| `http://localhost:3001/api/products` | JSON danh sách 23 sản phẩm (kèm prices) |
| `http://localhost:3001/api/products?category=phin` | JSON chỉ lọc Cà Phê Phin (3 món) |
| `http://localhost:3001/api/products/toppings` | JSON 15 loại topping |
| `http://localhost:3000` | Trang Next.js (Frontend) |

---

## 🔧 Các lệnh thường dùng

### Backend

```bash
cd backend

npm run start:dev       # Chạy dev (auto-reload)
npm run build           # Build production
npm run start           # Chạy production build
npx prisma studio       # Mở Prisma Studio (xem DB trên web)
npx prisma db push      # Đẩy schema thay đổi lên DB
npx prisma db seed      # Seed lại dữ liệu mẫu
npx prisma generate     # Regenerate Prisma Client (sau khi đổi schema)
```

### Frontend

```bash
cd frontend

npm run dev             # Chạy dev (Turbopack)
npm run build           # Build production (kiểm tra TypeScript)
npm run lint            # Kiểm tra ESLint
```

### Docker

```bash
# Khởi động Database
docker compose -f docker/docker-compose.dev.yml up -d

# Tắt Database
docker compose -f docker/docker-compose.dev.yml down

# Xem logs Database
docker compose -f docker/docker-compose.dev.yml logs -f

# Reset Database hoàn toàn (xóa sạch data)
docker compose -f docker/docker-compose.dev.yml down -v
cd backend && npx prisma db push --force-reset && npx prisma db seed
```

---

## 🗃 Kết nối Database bằng DataGrip / DBeaver

Nếu muốn xem và quản lý Database trực quan:

| Thông tin | Giá trị |
|-----------|---------|
| Host | `localhost` |
| Port | `5433` |
| User | `brewlite` |
| Password | `brewlite` |
| Database | `brewlite` |
| URL | `jdbc:postgresql://localhost:5433/brewlite` |

---

## 📖 Tài liệu dự án

| File | Nội dung |
|------|----------|
| [PROJECT_FLOW.md](./PROJECT_FLOW.md) | Kiến trúc, ERD (7 bảng), API Spec, State Machine, Sprint Planning, Non-functional |
| [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md) | Hướng dẫn Git workflow, phân chia 7 nhánh cho 7 thành viên |

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

