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
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand, React Query |
| Backend | NestJS, TypeScript, Prisma ORM, Passport JWT |
| Database | PostgreSQL 16 |
| DevOps | Docker Compose, Git |

## 📁 Cấu trúc dự án

```
brewlite/
├── frontend/          # Next.js application (Port 3000)
├── backend/           # NestJS application (Port 3001)
├── docker/            # Docker configurations
├── PROJECT_FLOW.md    # Tài liệu kiến trúc & flow dự án
└── README.md          # File này
```

## 🚀 Hướng dẫn cài đặt & chạy

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20.x
- [npm](https://www.npmjs.com/) >= 10.x
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com/)

### 1. Clone repository

```bash
git clone https://github.com/PhucTruong11/SWE.git
cd SWE
```

### 2. Tạo file environment

```bash
# Copy file .env.example ở root
cp .env.example .env

# Copy .env cho backend
cp backend/.env.example backend/.env

# Copy .env cho frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Khởi động Database (PostgreSQL via Docker)

> **⚠️ Lưu ý:** Bắt buộc phải mở ứng dụng **Docker Desktop** lên trước (chờ icon chuyển sang xanh lá).

```bash
# Đứng ở thư mục gốc (SWE)
docker compose -f docker/docker-compose.dev.yml up -d
```

Kiểm tra DB đã chạy:
```bash
docker compose -f docker/docker-compose.dev.yml ps
```

### 4. Khởi động Backend (NestJS)

Mở **Terminal 1**:
```bash
cd backend

# Cài dependencies
npm install

# Đồng bộ Prisma schema với DB và tạo file client
npx prisma db push
npx prisma generate

# Seed dữ liệu mẫu (23 đồ uống, 15 toppings)
npx prisma db seed

# Chạy dev server
npm run start:dev
```
Backend sẽ chạy tại: **http://localhost:3001/api**

### 5. Khởi động Frontend (Next.js)

Mở **Terminal 2** (Tạo tab terminal mới):
```bash
cd frontend

# Cài dependencies
npm install

# Chạy dev server
npm run dev
```
Frontend sẽ chạy tại: **http://localhost:3000**

## 🐳 Chạy toàn bộ bằng Docker (Sprint 3)

```bash
docker compose -f docker/docker-compose.yml up -d
```

## 📖 Tài liệu

- [PROJECT_FLOW.md](./PROJECT_FLOW.md) – Kiến trúc, ERD, API, State Machine, Sprint Planning

## 👥 Nhóm phát triển

| STT | Họ tên | MSSV | Vai trò |
|-----|--------|------|---------|
| 1 | | | Product Owner |
| 2 | | | Scrum Master |
| 3 | | | Developer |
| 4 | | | Developer |
| 5 | | | Developer |

## 📝 License

Bài tập lớn môn Công nghệ Phần mềm – Trường Đại học Sài Gòn – HK1 2026-2027
