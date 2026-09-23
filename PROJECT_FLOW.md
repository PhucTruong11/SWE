# BrewLite – Project Flow Document

> **Version:** 2.0  
> **Cập nhật:** 2026-09-22  
> **Product Vision:** *"BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."*

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Database Schema (ERD)](#3-database-schema-erd)
4. [API Specification](#4-api-specification)
5. [Luồng nghiệp vụ & State Machine](#5-luồng-nghiệp-vụ--state-machine)
6. [Cấu trúc thư mục dự án](#6-cấu-trúc-thư-mục-dự-án)
7. [Sprint Planning (3 Sprints)](#7-sprint-planning-3-sprints)
8. [Non-functional Requirements & Solutions](#8-non-functional-requirements--solutions)
9. [Development Conventions](#9-development-conventions)
10. [Definition of Done](#10-definition-of-done)

---

## 1. Tổng quan dự án

### 1.1 Product Vision

BrewLite là ứng dụng đặt cà phê không dùng tiền mặt, giúp khách hàng:
- Duyệt menu → Chọn sản phẩm (size, topping) → Thêm giỏ hàng → Thanh toán online → Nhận đồ tại quầy

### 1.2 Phạm vi MVP

| Trong phạm vi | Ngoài phạm vi |
|---|---|
| Khách hàng đặt & thanh toán đơn | Dashboard admin/quản lý |
| Xem menu, chọn size/topping | Giao hàng delivery |
| Đăng ký / Đăng nhập (JWT) | Chat/hỗ trợ khách hàng |
| Lịch sử đơn hàng | Quản lý kho chi tiết |
| Mock Payment Gateway | Tích hợp cổng thanh toán thật |
| Khuyến mãi & Điểm thưởng cơ bản | CRM / Marketing automation |

### 1.3 Stakeholders

| Vai trò | Mô tả |
|---|---|
| **Khách hàng** | Đặt đồ uống, thanh toán không tiền mặt, theo dõi đơn |
| **Nhân viên/Barista** | Tiếp nhận và cập nhật trạng thái (ngoài MVP) |
| **Product Owner** | Xác định yêu cầu, ưu tiên backlog, nghiệm thu |
| **Giảng viên** | Đánh giá quy trình & sản phẩm |
| **Nhóm phát triển** | Phân tích, thiết kế, lập trình, kiểm thử |

---

## 2. Kiến trúc hệ thống

### 2.1 Architecture Overview

```mermaid
graph LR
    subgraph Client
        A["Next.js<br/>(Frontend SSR/CSR)"]
    end
    
    subgraph Server
        B["NestJS<br/>(REST API)"]
    end
    
    subgraph Data
        C[("PostgreSQL")]
    end
    
    subgraph External
        D["Mock Payment<br/>Gateway"]
    end
    
    A -->|"REST/JSON<br/>+ JWT Cookie"| B
    B -->|"Prisma ORM"| C
    B -->|"HTTP POST"| D
    D -->|"callback/response"| B
```

### 2.2 Tech Stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS | SSR cho SEO, CSR cho tương tác |
| **State Management** | Zustand (Cart), React Query (Server state) | Nhẹ, đơn giản, hiệu quả |
| **Backend** | NestJS (TypeScript), REST API | Modular architecture, DI |
| **Validation** | class-validator, class-transformer | DTO validation |
| **Authentication** | Passport JWT, bcrypt | HttpOnly Cookie |
| **Database** | PostgreSQL 16 + Prisma ORM | Type-safe queries |
| **Payment** | Mock Payment Service | Mô phỏng Momo/VNPay |
| **DevOps** | Docker Compose, Git | PostgreSQL container (dev) |
| **Code Quality** | ESLint, Prettier | Thống nhất code style |

### 2.3 Communication Flow

```
┌──────────────┐     HTTP/REST      ┌──────────────┐     Prisma      ┌──────────────┐
│   Next.js    │ ──────────────────► │   NestJS     │ ──────────────► │  PostgreSQL   │
│  (Port 3000) │ ◄────────────────── │  (Port 3001) │ ◄────────────── │  (Port 5433)  │
└──────────────┘     JSON + JWT     └──────────────┘     SQL Query   └──────────────┘
                     (HttpOnly                │
                      Cookie)                 │ HTTP POST
                                              ▼
                                    ┌──────────────┐
                                    │ Mock Payment │
                                    │   Gateway    │
                                    └──────────────┘
```

---

## 3. Database Schema (ERD)

### 3.1 Entity Relationship Diagram (7 bảng)

```mermaid
erDiagram
    USER ||--o{ ORDER : "places"
    ORDER ||--|{ ORDER_ITEM : "contains"
    ORDER ||--o{ PAYMENT : "has"
    PRODUCT ||--o{ ORDER_ITEM : "referenced in"
    PRODUCT ||--|{ PRODUCT_PRICE : "has prices"

    USER {
        string id PK "UUID"
        string email UK "unique"
        string passwordHash "bcrypt"
        int loyaltyPoints "default 0"
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT {
        string id PK "UUID"
        string name
        string description "mô tả ngắn"
        string imageUrl
        string category "phin, tra, freeze, phindi, espresso, other"
        boolean allowToppings "cho phép thêm topping"
        int stock "tồn kho"
        int version "optimistic locking"
        boolean isAvailable "default true"
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT_PRICE {
        string id PK "UUID"
        string productId FK
        enum size "S, M, L"
        int price "VND"
    }

    TOPPING {
        string id PK "UUID"
        string name UK "unique"
        int price "VND"
        string imageUrl
        boolean isAvailable "default true"
    }

    ORDER {
        string id PK "UUID"
        string userId FK
        enum status "PENDING..CANCELLED"
        int total "VND"
        int discount "VND"
        string promoCode "nullable"
        int loyaltyPointsEarned
        datetime createdAt
        datetime updatedAt
    }

    ORDER_ITEM {
        string id PK "UUID"
        string orderId FK
        string productId FK
        enum size "S, M, L"
        string_array toppings "snapshot tên"
        int qty
        int lineTotal "VND"
    }

    PAYMENT {
        string id PK "UUID"
        string orderId FK
        string idempotencyKey UK
        int amount "VND"
        enum method "EWALLET, CARD"
        enum status "PENDING, SUCCESS, FAILED"
        datetime createdAt
    }
```

### 3.2 Mô tả chi tiết

**Quy ước chung:**
- Tất cả `id` dùng UUID v4
- Giá tiền lưu bằng **đơn vị VND (integer)** – tránh lỗi floating point
- Timestamp tự động: `createdAt`, `updatedAt`

**Tính giá theo size (Bảng `product_prices`):**

Mỗi sản phẩm có bảng giá riêng theo từng size. Không dùng hệ số nhân vì giá thực tế không tuân theo tỉ lệ cố định.

| Sản phẩm | S | M | L |
|----------|---|---|---|
| Phin Sữa Đá | 29.000đ | 39.000đ | 45.000đ |
| Trà Sữa Highlands | — | 65.000đ | 69.000đ |
| Freeze Trà Xanh | 55.000đ | 65.000đ | 69.000đ |

> Một số sản phẩm **không có đủ 3 size** (VD: Trà Sữa không có size S). Bảng `product_prices` cho phép linh hoạt này.

**Topping (Bảng `toppings`):**

Bảng riêng lưu 15 loại topping kèm giá. Chỉ những Product có `allowToppings = true` mới hiển thị topping trên FE.
Khi khách đặt hàng, tên topping được **snapshot** (copy) vào cột `toppings String[]` trong `order_items` để giữ nguyên thông tin tại thời điểm đặt.

| Topping | Giá |
|---------|-----|
| Trân Châu Dừa, Trân Châu Khoai Môn, Trân Châu Trắng | 9.000đ |
| Thạch Cà Phê, Thạch Trà Xanh, Thạch Vải, Thạch Đào | 9.000đ |
| Kem Sữa Mặn, Kem Tươi, Củ Năng, Đậu Đỏ | 9.000đ |
| Hạt Sen, Trái Vải, Đào Lát | 15.000đ |
| Shot Espresso | 10.000đ |

### 3.3 Indexes (Tối ưu truy vấn)

| Bảng | Index | Mục đích |
|------|-------|----------|
| `orders` | `@@index([userId])` | Tra cứu lịch sử mua hàng nhanh |
| `orders` | `@@index([createdAt])` | Sắp xếp đơn mới nhất nhanh |
| `payments` | `@@index([orderId])` | Tra cứu thanh toán theo đơn |
| `product_prices` | `@@unique([productId, size])` | Đảm bảo mỗi sản phẩm chỉ có 1 giá cho mỗi size |

---

## 4. API Specification

### 4.1 Base URL

```
Development: http://localhost:3001/api
```

### 4.2 Endpoints

#### 🟢 Products (Public)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| `GET` | `/products` | Danh sách sản phẩm (menu) | ❌ |
| `GET` | `/products?category=phin` | Lọc theo danh mục | ❌ |
| `GET` | `/products/:id` | Chi tiết một sản phẩm | ❌ |
| `GET` | `/products/toppings` | Danh sách topping | ❌ |

**GET /products Response:** *(bao gồm bảng giá theo size)*
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Phin Sữa Đá",
      "description": "Iced Coffee with Condensed Milk",
      "imageUrl": "/images/phin-sua-da.jpg",
      "category": "phin",
      "allowToppings": false,
      "stock": 100,
      "isAvailable": true,
      "prices": [
        { "size": "S", "price": 29000 },
        { "size": "M", "price": 39000 },
        { "size": "L", "price": 45000 }
      ]
    }
  ]
}
```

**GET /products/toppings Response:**
```json
{
  "data": [
    { "id": "uuid", "name": "Trân Châu Dừa", "price": 9000, "imageUrl": "/images/toppings/tran-chau-dua.jpg" },
    { "id": "uuid", "name": "Hạt Sen", "price": 15000, "imageUrl": "/images/toppings/hat-sen.jpg" }
  ]
}
```

**Danh mục (`category`) hợp lệ:** `phin`, `tra`, `freeze`, `phindi`, `espresso`, `other`

#### 🔵 Authentication (Public)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| `POST` | `/auth/register` | Đăng ký tài khoản | ❌ |
| `POST` | `/auth/login` | Đăng nhập, set JWT cookie | ❌ |
| `POST` | `/auth/logout` | Xóa JWT cookie | ✅ |

**POST /auth/register Request:**
```json
{
  "email": "user@example.com",
  "password": "StrongP@ss1"
}
```

**POST /auth/login Response:** (Set HttpOnly Cookie)
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "loyaltyPoints": 0
  }
}
```

#### 🟡 Orders (Protected)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| `POST` | `/orders` | Tạo đơn hàng (PENDING) | ✅ |
| `GET` | `/orders/me` | Lịch sử đơn của user | ✅ |
| `GET` | `/orders/:id` | Chi tiết một đơn | ✅ |

**POST /orders Request:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "size": "M",
      "toppings": ["Trân châu"],
      "qty": 1
    }
  ],
  "promoCode": "WELCOME10"
}
```

**POST /orders Response:**
```json
{
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "total": 59000,
    "discount": 5900,
    "items": [...],
    "createdAt": "2026-09-21T12:00:00Z"
  }
}
```

#### 🔴 Payments (Protected)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| `POST` | `/payments` | Thanh toán đơn (idempotent) | ✅ |

**POST /payments Request:**
```json
{
  "orderId": "uuid",
  "method": "EWALLET"
}
```

**Headers:**
```
Idempotency-Key: <uuid-v4-generated-by-client>
```

**POST /payments Response (Success):**
```json
{
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "amount": 53100,
    "method": "EWALLET",
    "status": "SUCCESS"
  },
  "order": {
    "id": "uuid",
    "status": "PAID"
  }
}
```

### 4.3 Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email"
    }
  ]
}
```

### 4.4 Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client (Next.js)
    participant S as Server (NestJS)
    participant DB as PostgreSQL

    C->>S: POST /auth/login { email, password }
    S->>DB: Find user by email
    DB-->>S: User record
    S->>S: Verify bcrypt hash
    S->>S: Sign JWT (userId, email)
    S-->>C: Set-Cookie: jwt=<token>; HttpOnly; Path=/
    Note over C,S: Subsequent requests include cookie automatically
    C->>S: GET /orders/me (Cookie: jwt=<token>)
    S->>S: JwtAuthGuard → extract & verify token
    S->>DB: Query orders WHERE userId = token.userId
    DB-->>S: Orders list
    S-->>C: 200 OK { data: [...] }
```

---

## 5. Luồng nghiệp vụ & State Machine

### 5.1 Happy Path Flow

```mermaid
flowchart TD
    A["🏠 Mở App"] --> B["📋 Xem Menu"]
    B --> C["☕ Chọn sản phẩm\n(size, topping)"]
    C --> D["🛒 Thêm vào giỏ hàng"]
    D --> E{"Mua thêm?"}
    E -->|"Có"| B
    E -->|"Không"| F["👀 Xem giỏ & tổng tiền"]
    F --> G{"Đã đăng nhập?"}
    G -->|"Chưa"| H["🔐 Đăng nhập / Đăng ký"]
    H --> I
    G -->|"Rồi"| I["💳 Thanh toán\n(Ví / Thẻ)"]
    I --> J{"Thanh toán\nthành công?"}
    J -->|"✅ Thành công"| K["✓ Xác nhận đơn\n(Mã đơn, status: PAID)"]
    J -->|"❌ Thất bại"| L["⚠️ PAYMENT_FAILED\nGiỏ hàng giữ nguyên"]
    L --> I
    K --> M["🥤 Nhận đồ uống tại quầy"]

    style A fill:#e8f5e9
    style K fill:#e8f5e9
    style M fill:#c8e6c9
    style L fill:#ffebee
```

### 5.2 Order State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Tạo đơn (POST /orders)
    
    PENDING --> PAID: Thanh toán OK
    PENDING --> PAYMENT_FAILED: Thanh toán lỗi
    PENDING --> CANCELLED: Hủy đơn
    
    PAYMENT_FAILED --> PAID: Thử lại thanh toán
    PAYMENT_FAILED --> CANCELLED: Hủy đơn
    
    PAID --> PREPARING: Barista nhận đơn
    PAID --> CANCELLED: Hủy đơn
    
    PREPARING --> READY: Pha xong
    
    READY --> COMPLETED: Giao khách
    
    COMPLETED --> [*]
    CANCELLED --> [*]
```

### 5.3 Allowed Transitions Map

```typescript
// backend/src/modules/orders/order-state.ts
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:        ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAID', 'CANCELLED'],
  PAID:           ['PREPARING', 'CANCELLED'],
  PREPARING:      ['READY'],
  READY:          ['COMPLETED'],
  COMPLETED:      [],  // terminal state
  CANCELLED:      [],  // terminal state
};

function assertTransition(current: OrderStatus, next: OrderStatus): void {
  if (!ALLOWED_TRANSITIONS[current].includes(next)) {
    throw new BadRequestException(
      `Cannot transition from ${current} to ${next}`
    );
  }
}
```

### 5.4 Payment Idempotency Flow

```mermaid
flowchart TD
    A["Client gửi POST /payments\n+ Header: Idempotency-Key"] --> B{"Key đã tồn tại\ntrong DB?"}
    B -->|"Không"| C["Xử lý thanh toán"]
    C --> D{"Mock Payment\nthành công?"}
    D -->|"Thành công"| E["Lưu Payment (SUCCESS)\nĐơn → PAID\nCộng loyalty points"]
    D -->|"Thất bại"| F["Lưu Payment (FAILED)\nĐơn → PAYMENT_FAILED"]
    B -->|"Có"| G{"Payment status?"}
    G -->|"SUCCESS"| H["Trả về kết quả cũ\n(không xử lý lại)"]
    G -->|"FAILED"| I["Cho phép thử lại\n(với Key mới)"]

    style E fill:#c8e6c9
    style F fill:#ffebee
    style H fill:#e3f2fd
```

### 5.5 Optimistic Locking Flow (Kiểm soát tồn kho)

```mermaid
sequenceDiagram
    participant U1 as User A
    participant U2 as User B  
    participant API as NestJS
    participant DB as PostgreSQL

    Note over DB: Product X: stock=1, version=1
    
    U1->>API: POST /orders (Product X, qty=1)
    U2->>API: POST /orders (Product X, qty=1)
    
    API->>DB: BEGIN TRANSACTION (User A)
    API->>DB: UPDATE product SET stock=0, version=2<br/>WHERE id=X AND stock>=1 AND version=1
    DB-->>API: affected_rows = 1 ✅
    API->>DB: INSERT order... COMMIT
    
    API->>DB: BEGIN TRANSACTION (User B)
    API->>DB: UPDATE product SET stock=0, version=2<br/>WHERE id=X AND stock>=1 AND version=1
    DB-->>API: affected_rows = 0 ❌ (version changed!)
    API->>DB: ROLLBACK
    API-->>U2: 409 Conflict - Sản phẩm hết hàng
```

---

## 6. Cấu trúc thư mục dự án

```
brewlite/
├── 📁 frontend/                      # Next.js Application
│   ├── 📁 public/                    # Static assets
│   │   └── 📁 images/               # Product images
│   ├── 📁 src/
│   │   ├── 📁 app/                   # App Router (pages)
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Home → redirect /menu
│   │   │   ├── 📁 menu/             # Menu page
│   │   │   │   └── page.tsx
│   │   │   ├── 📁 product/
│   │   │   │   └── 📁 [id]/         # Product detail page
│   │   │   │       └── page.tsx
│   │   │   ├── 📁 cart/             # Cart page
│   │   │   │   └── page.tsx
│   │   │   ├── 📁 checkout/         # Checkout/Payment page
│   │   │   │   └── page.tsx
│   │   │   ├── 📁 order/
│   │   │   │   └── 📁 [id]/         # Order confirmation page
│   │   │   │       └── page.tsx
│   │   │   ├── 📁 orders/           # Order history page
│   │   │   │   └── page.tsx
│   │   │   └── 📁 auth/
│   │   │       ├── 📁 login/        # Login page
│   │   │       │   └── page.tsx
│   │   │       └── 📁 register/     # Register page
│   │   │           └── page.tsx
│   │   ├── 📁 components/
│   │   │   ├── 📁 ui/               # Reusable UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Badge.tsx
│   │   │   ├── 📁 layout/           # Layout components
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── 📁 product/          # Product-specific components
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   └── ProductGrid.tsx
│   │   │   └── 📁 cart/             # Cart-specific components
│   │   │       ├── CartItem.tsx
│   │   │       └── CartSummary.tsx
│   │   ├── 📁 lib/
│   │   │   ├── api.ts               # Axios instance + interceptors
│   │   │   └── utils.ts             # Helper functions
│   │   ├── 📁 stores/
│   │   │   └── cart.store.ts         # Zustand cart store
│   │   ├── 📁 hooks/
│   │   │   ├── useAuth.ts           # Auth hook
│   │   │   └── useProducts.ts       # React Query hooks
│   │   └── 📁 types/
│   │       └── index.ts             # Shared TypeScript types
│   ├── .env.example
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── 📁 backend/                       # NestJS Application
│   ├── 📁 prisma/
│   │   ├── schema.prisma            # Database schema
│   │   └── 📁 seed/
│   │       └── seed.ts              # Seed data (menu items)
│   ├── 📁 src/
│   │   ├── 📁 modules/
│   │   │   ├── 📁 prisma/           # PrismaModule (shared)
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   ├── 📁 products/         # ProductModule
│   │   │   │   ├── products.module.ts
│   │   │   │   ├── products.controller.ts
│   │   │   │   ├── products.service.ts
│   │   │   │   └── dto/
│   │   │   ├── 📁 auth/             # AuthModule
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── dto/
│   │   │   ├── 📁 orders/           # OrderModule
│   │   │   │   ├── orders.module.ts
│   │   │   │   ├── orders.controller.ts
│   │   │   │   ├── orders.service.ts
│   │   │   │   ├── order-state.ts   # State Machine
│   │   │   │   └── dto/
│   │   │   └── 📁 payments/         # PaymentModule
│   │   │       ├── payments.module.ts
│   │   │       ├── payments.controller.ts
│   │   │       ├── payments.service.ts
│   │   │       ├── mock-payment.service.ts
│   │   │       └── dto/
│   │   ├── 📁 common/
│   │   │   ├── 📁 decorators/       # Custom decorators
│   │   │   │   └── current-user.decorator.ts
│   │   │   ├── 📁 filters/          # Exception filters
│   │   │   │   └── http-exception.filter.ts
│   │   │   └── 📁 interceptors/
│   │   │       └── transform.interceptor.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── 📁 test/
│   │   ├── orders.e2e-spec.ts       # Order state machine tests
│   │   └── payments.e2e-spec.ts     # Idempotency tests
│   ├── .env.example
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
│
├── 📁 docker/
│   ├── docker-compose.dev.yml       # Dev: PostgreSQL only
│   └── docker-compose.yml           # Prod: All 3 services (Sprint 3)
│
├── PROJECT_FLOW.md                   # ← Tài liệu này
├── README.md                         # Hướng dẫn chạy dự án
├── .gitignore
└── .env.example                      # Template biến môi trường
```

---

## 7. Sprint Planning (3 Sprints)

### Sprint 1: Nền tảng & Hiển thị Menu (Task 1-4)

**Sprint Goal:** *"Khách hàng có thể xem menu và chi tiết sản phẩm trên trình duyệt"*

| Task | Story | Tiêu chí chấp nhận | Ưu tiên |
|------|-------|---------------------|---------|
| **1** | Khởi tạo dự án | Monorepo chạy được "Hello", Git, README, .env.example | P0 |
| **2** | API danh sách sản phẩm | `GET /products` trả JSON từ DB, có seed data | P0 |
| **3** | Trang Menu (Frontend) | Gọi API, render grid sản phẩm, loading/empty state | P0 |
| **4** | Chi tiết & tùy chọn | Chọn size S/M/L, topping, tính giá theo tùy chọn | P1 |

**Deliverable:** Trang menu hoạt động, hiển thị sản phẩm từ database.

---

### Sprint 2: Giỏ hàng, Đơn hàng & Auth (Task 5-7)

**Sprint Goal:** *"Khách hàng đăng nhập và đặt đơn hàng được"*

| Task | Story | Tiêu chí chấp nhận | Ưu tiên |
|------|-------|---------------------|---------|
| **5** | Giỏ hàng (Cart) | Thêm/sửa/xóa, Zustand store, tính tổng, badge count | P0 |
| **6** | API tạo đơn hàng | `POST /orders` validate & lưu PENDING, trả mã đơn | P0 |
| **7** | Đăng ký / Đăng nhập | Register, Login, bcrypt, JWT cookie, guard routes | P0 |

**Deliverable:** User flow hoàn chỉnh từ menu → giỏ → đăng nhập → tạo đơn.

---

### Sprint 3: Thanh toán, Bàn giao & Nghiệp vụ nâng cao (Task 8-10)

**Sprint Goal:** *"Hệ thống thanh toán hoạt động, đóng gói Docker, demo end-to-end"*

| Task | Story | Tiêu chí chấp nhận | Ưu tiên |
|------|-------|---------------------|---------|
| **8** | Thanh toán không tiền mặt | Mock payment, `POST /payments`, PAID/PAYMENT_FAILED | P0 |
| **9** | Xác nhận, lịch sử & bàn giao | Màn hình xác nhận, `GET /orders/me`, docker-compose full, README | P0 |
| **10** | Nghiệp vụ backend | State Machine, Idempotency, Optimistic Locking, Loyalty points | P1 |

**Deliverable:** Sản phẩm hoàn chỉnh, docker-compose chạy full, demo E2E.

---

## 8. Non-functional Requirements & Solutions

### 8.1 Hiệu năng (API < 500ms)

| Vấn đề | Giải pháp | Trạng thái |
|--------|-----------|---------|
| API GET /products chậm | Next.js ISR/SSG cache menu | Sprint 1 |
| N+1 query Prisma | Eager loading `include: { prices: true }` | ✅ Đã áp dụng |
| Response lớn | Pagination cho /orders/me | Sprint 3 |
| Truy vấn chậm theo userId/orderId | Database Indexes (`@@index`) | ✅ Đã áp dụng |

### 8.2 Bảo mật

| Vấn đề | Giải pháp | Trạng thái |
|--------|-----------|---------|
| Token bị đánh cắp (XSS) | JWT trong HttpOnly Cookie, SameSite=Strict | Sprint 2 |
| SQL Injection | Prisma parameterized queries (mặc định) | ✅ Mặc định |
| Password leak | bcrypt hash với salt rounds = 10 | Sprint 2 |
| Invalid input | class-validator trên mọi DTO | Sprint 1 |
| CORS | Whitelist `localhost:3000` cho dev | ✅ Đã áp dụng |
| Email chưa xác thực | OTP 6 số qua Email (Nodemailer) – hết hạn sau 3 phút | Sprint 2 |
| Quên mật khẩu | OTP reset password qua Email | Sprint 2 |

### 8.3 Tính toàn vẹn dữ liệu

| Vấn đề | Giải pháp | Trạng thái |
|--------|-----------|---------|
| Double payment | Idempotency-Key header + `@@unique` constraint trên `Payment.idempotencyKey` | ✅ Schema đã có |
| Race condition tồn kho | Optimistic Locking (`version` field) + transaction | ✅ Schema đã có |
| Invalid state transition | Order State Machine (`assertTransition`) | Sprint 3 |
| Đơn PENDING treo lâu | Timeout 5 phút – tự hủy đơn bằng `@nestjs/schedule` Cron Job | Sprint 3 |
| Giá size không đúng | Bảng `product_prices` riêng, `@@unique([productId, size])` | ✅ Đã áp dụng |
| Topping lộn xộn | Bảng `toppings` riêng + `allowToppings` flag trên Product | ✅ Đã áp dụng |

### 8.4 Tương thích trình duyệt

- Target: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Responsive design: Mobile-first (wireframe hiển thị dạng mobile)
- Tailwind CSS đảm bảo cross-browser compatibility

### 8.5 Luồng Timeout Hủy Đơn Hàng (5 phút)

Khi khách hàng tạo đơn nhưng không thanh toán quá lâu, hệ thống tự động hủy đơn để hoàn trả tồn kho.

```mermaid
sequenceDiagram
    participant U as User (Frontend)
    participant B as Backend
    participant CR as Cron Job (NestJS Schedule)
    
    U->>B: Tạo Order & Lấy mã QR
    B-->>U: Trả về QR + expiresAt (VD: 10:05 AM)
    U->>U: Hiển thị đồng hồ đếm ngược 05:00
    
    loop Mỗi 1 phút
        CR->>B: Tìm Order (status=PENDING & expiresAt < NOW)
        B->>B: Đổi trạng thái thành CANCELLED
        B->>B: Hoàn lại tồn kho cho Product
    end
    
    alt Không thanh toán sau 5 phút
        U->>U: Đồng hồ về 00:00 → UI "Đơn bị hủy"
    else Thanh toán thành công trong 5 phút
        U->>B: Thanh toán thành công
        B->>B: Đổi status = PAID, hủy timeout
    end
```

### 8.6 Luồng Xác thực OTP qua Email

```mermaid
sequenceDiagram
    participant U as User
    participant B as Backend
    participant M as Email Server (Nodemailer)
    
    U->>B: POST /auth/register (Email, Password)
    B->>B: Tạo User (isVerified=false), Sinh OTP 6 số (hết hạn 3 phút)
    B->>M: Gửi OTP tới Email
    M-->>U: Nhận Email chứa OTP
    B-->>U: 201 Created (Yêu cầu xác thực)
    
    U->>B: POST /auth/verify-otp (Email, OTP)
    B->>B: Kiểm tra OTP đúng & chưa hết hạn
    B->>B: Đổi isVerified = true, xóa otpCode
    B-->>U: 200 OK (Đăng nhập thành công)
```

---

## 9. Development Conventions

### 9.1 Git Branching Strategy

```
main                    ← Production-ready (protected)
├── develop             ← Integration branch
│   ├── feature/task-1  ← Từng task
│   ├── feature/task-2
│   ├── feature/task-3
│   └── ...
└── hotfix/*            ← Emergency fixes
```

**Workflow:**
1. Tạo branch từ `develop`: `git checkout -b feature/task-X develop`
2. Code & commit thường xuyên
3. Push & tạo Pull Request → develop
4. Review (ít nhất 1 member) → Merge
5. Cuối Sprint: merge `develop` → `main` → Tag version

### 9.2 Commit Message Convention

Sử dụng **Conventional Commits:**

```
<type>(<scope>): <description>

feat(products): add GET /products endpoint
fix(cart): correct total calculation with toppings  
chore(docker): add PostgreSQL dev compose file
docs(readme): add setup instructions
test(orders): add state machine unit tests
refactor(auth): extract JWT strategy to separate file
```

**Types:** `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`

### 9.3 Code Style

**ESLint + Prettier** cấu hình chung:
- **Single quotes**, **Trailing commas**, **Semicolons**
- Max line length: 100 characters
- Indent: 2 spaces

### 9.4 Naming Conventions

| Đối tượng | Convention | Ví dụ |
|-----------|-----------|-------|
| File/Folder | kebab-case | `products.controller.ts` |
| Class | PascalCase | `ProductsService` |
| Function/Method | camelCase | `findAll()` |
| Variable | camelCase | `totalPrice` |
| Constant | UPPER_SNAKE_CASE | `JWT_SECRET` |
| Database table | snake_case | `order_items` |
| Enum | PascalCase + UPPER_SNAKE_CASE values | `OrderStatus.PENDING` |
| DTO | PascalCase + "Dto" suffix | `CreateOrderDto` |
| API route | kebab-case, plural | `/products`, `/orders` |

---

## 10. Definition of Done

Mỗi task được coi là **DONE** khi thỏa mãn:

- [ ] Code chạy được, không lỗi build
- [ ] Tuân theo tiêu chí chấp nhận (Acceptance Criteria) của task
- [ ] Commit trên Git với message rõ ràng (Conventional Commits)
- [ ] Được review bởi ít nhất 1 thành viên khác
- [ ] API có validate đầu vào (class-validator)
- [ ] UI xử lý loading/error state cơ bản
- [ ] Có hướng dẫn chạy trong README
- [ ] (Task 10) Có unit/integration test chứng minh logic

---

> **Ghi chú:** Tài liệu này là "living document" – sẽ được cập nhật qua từng Sprint khi có thay đổi yêu cầu hoặc thiết kế.
