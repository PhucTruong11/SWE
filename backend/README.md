# BrewLite API

API NestJS cho menu, xác thực, giỏ/kiểm tra nguyên liệu, tạo đơn, checkout mô phỏng, điểm thưởng và admin. Hướng dẫn **chạy cả hệ thống** và xử lý DB nằm ở [README gốc](../README.md) và [Docker README](../docker/README.md). Dùng các tài liệu đó khi mới pull code; không chạy seed trên DB đã có đơn.

## Cấu trúc nghiệp vụ

| Module | Chức năng |
| --- | --- |
| `products`, `inventory` | Danh mục, công thức, kiểm tra giỏ và giữ/trừ/trả nguyên liệu |
| `orders` | Tạo đơn `PENDING` cho user đã đăng nhập, lưu snapshot công thức và giữ nguyên liệu 2 phút |
| `checkout` | Thanh toán mô phỏng, idempotency, hết hạn, hoàn giữ chỗ |
| `auth`, `rewards`, `promotions` | Tài khoản JWT, điểm và mã giảm giá |
| `admin` | Đơn, khuyến mãi, API chỉ đọc nguyên liệu/công thức |

Nguồn schema là [schema.prisma](prisma/schema.prisma). Đơn mới dùng `Ingredient.onHand/reserved`; `Product.stock` chỉ còn hỗ trợ đơn `LEGACY`. API ghi để quản lý nguyên liệu và công thức chưa hoàn thành.

## Kiểm tra mã nguồn

Chạy trong thư mục `backend` với Node 22 và dependency từ `npm ci`:

```powershell
npx prisma generate
npm run lint
npm run build
npm test
```

Các lệnh trên là bước CI, không tạo dữ liệu. `npm run test:ingredients` là test tích hợp dùng **DB thử riêng**; cách thiết lập và bảo vệ DB nằm trong [README gốc](../README.md). API chạy local trực tiếp bằng `npm run start:dev` chỉ khi đã cấu hình `backend/.env` và không chạy đồng thời container `api` cùng cổng 3001.
