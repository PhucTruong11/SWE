# BrewLite: kiến trúc và luồng hệ thống

Cập nhật: 28/10/2026. Tài liệu mô tả **mã đang chạy**. Hướng dẫn cài đặt ở [README.md](README.md), vận hành container ở [docker/README.md](docker/README.md), thiết kế kho ở [INVENTORY_RECIPE_PLAN.md](INVENTORY_RECIPE_PLAN.md).

## 1. Phạm vi và thành phần

BrewLite bán đồ uống nhận tại quầy. Khách xem menu, chọn size/topping, quản lý giỏ, đăng nhập, tạo đơn, xác nhận thanh toán mô phỏng và theo dõi trạng thái. ADMIN xem đơn đã thanh toán, chuyển trạng thái và xem dữ liệu nguyên liệu/công thức.

| Thành phần | Vai trò | Mã nguồn |
| --- | --- | --- |
| Next.js 16, cổng 3000 | Giao diện khách và admin; chuyển tiếp `/api` đến backend | `frontend/src`, `frontend/next.config.ts` |
| Zustand và localStorage | Giữ giỏ/voucher theo khách hoặc tài khoản; trạng thái gia hạn trên trình duyệt | `frontend/src/stores/cart.store.ts` |
| NestJS 12, cổng 3001 | JWT, DTO, nghiệp vụ giỏ/đơn/thanh toán, API admin | `backend/src/modules` |
| Prisma và PostgreSQL 16 | Lưu đơn, thanh toán, điểm, công thức và kho; transaction giữ/trừ/trả nguyên liệu | `backend/prisma/schema.prisma` |
| Docker Compose | Chạy `db`, `api`, `web`; DB dùng volume riêng | `docker/docker-compose.dev.yml`, `docker/docker-compose.app.yml` |

Web gọi API cùng origin qua `/api`, rồi Next.js chuyển tiếp đến `api:3001` trong Compose. Host dùng `localhost:3000` cho web, `localhost:3001` cho API và `localhost:5433` cho PostgreSQL. Thanh toán hiện là **mô phỏng**, không xác nhận giao dịch thật từ ngân hàng/MoMo.

## 2. Dữ liệu và nguồn tồn kho

Nguồn đúng là [schema.prisma](backend/prisma/schema.prisma). Hai bảng mới là `ingredients` và `recipes`:

| Bảng | Vai trò |
| --- | --- |
| `products`, `product_prices`, `toppings` | Danh mục, giá S/M/L và topping; hiện chỉ bật bán 6 món/3 topping mẫu |
| `ingredients` | Tên, đơn vị, quy cách nhập, `onHand`, `reserved`, `version`; nước có `trackStock=false` và tồn `NULL` |
| `recipes` | Định lượng nguyên liệu cho từng product + size hoặc một phần topping |
| `orders`, `order_items` | Trạng thái đơn, hạn giữ chỗ, giá đã tính và `recipeSnapshot` của món lúc đặt |
| `payments` | Kết quả thanh toán và `idempotencyKey` |
| `users`, `point_transactions`, `reward_items`, `user_vouchers` | Tài khoản, điểm, ưu đãi đổi điểm và voucher sở hữu |
| `promotions` | Quy tắc mã giảm giá và thời gian hiệu lực |
| `email_verifications`, `password_resets` | Xác minh email và đặt lại mật khẩu; vẫn được giữ |

Đơn **mới** dựa trên `ingredients.onHand - ingredients.reserved`, cộng định lượng theo toàn bộ giỏ và giữ nguyên liệu khi tạo đơn. `Product.stock` và `Product.version` còn trong schema để xử lý đơn cũ có `inventoryState=LEGACY`; không dùng `Product.stock` làm nguồn tồn cho đơn mới. Bảng `addresses` đã bỏ khỏi Prisma, nhưng DB cũ có thể còn bảng vật lý cho đến khi chạy migration xóa riêng.

## 3. Giỏ hàng và kiểm tra nguyên liệu

1. [ProductCard.tsx](frontend/src/components/product/ProductCard.tsx) và trang chi tiết lấy menu, giá, khả năng bán từ API.
2. [cart.store.ts](frontend/src/stores/cart.store.ts) gộp cùng product ID + size + số phần từng topping; khác cấu hình được tách dòng. Giỏ/voucher được lưu theo khách hoặc user.
3. [CartContent.tsx](frontend/src/components/cart/CartContent.tsx) gọi `POST /api/cart/validate` để đối chiếu **toàn bộ giỏ** với dữ liệu thật, gồm sản phẩm, công thức, topping và lượng nguyên liệu khả dụng. Validation chỉ đọc, chưa giữ/trừ tồn.
4. Frontend tính tiền để hiển thị; backend luôn tính lại giá và mã giảm trước khi tạo đơn. Nếu thiếu một nguyên liệu, frontend báo thiếu và chặn thao tác tăng số lượng hoặc tiếp tục thanh toán.

Một dòng giỏ không phải một bản ghi kho. Nhiều món cùng dùng đá, ly, cà phê hoặc topping được cộng nhu cầu theo nguyên liệu. Vì vậy việc kiểm tra từng món riêng lẻ không đủ để kết luận toàn giỏ có thể bán.

## 4. Tạo đơn và thanh toán

| Bước | File/API | Kết quả |
| --- | --- | --- |
| Khách bấm “Tiến hành Thanh toán” | `CartContent.tsx` | Kiểm tra đăng nhập và validate giỏ lần cuối |
| Tạo đơn | `POST /api/orders` → `orders.controller.ts` → `orders.service.ts` | Backend tính lại giá/voucher, gọi `inventory.service.ts` để giữ nguyên liệu trong transaction; tạo `PENDING`, `RESERVED`, trả `orderId` và `reservationExpiresAt` |
| Mở trang QR | `frontend/src/app/checkout/page.tsx?orderId=...` | Hiển thị đơn và đồng hồ 2 phút **tính từ khi tạo đơn**; hỏi status mỗi 2 giây |
| Khách bấm “Xác nhận trả” | `POST /api/checkout` (`/api/payments` là alias) | Kiểm tra chủ đơn, hạn và idempotency key; mô phỏng thanh toán |
| Thành công | `checkout.service.ts` + `inventory.service.ts` | Trừ `onHand` và `reserved` một lần, lưu Payment, chuyển `PAID`, cộng điểm và dùng voucher đổi điểm; hiện hóa đơn |
| Thanh toán lỗi | `checkout.service.ts` | Chuyển `PAYMENT_FAILED`; giữ nguyên liệu đến hạn để thử lại |
| Hết 2 phút | `checkout.service.ts` | Hủy đơn và trả `reserved` (status endpoint hoặc job dọn hết hạn) |
| Gia hạn một lần | `checkout/page.tsx` | Tạo **đơn mới** từ giỏ sau khi đơn cũ hết hạn; đơn mới có 2 phút riêng, không kéo dài hạn đơn cũ |

Không trừ tồn lúc chỉ mở giỏ hoặc validate giỏ. Khi đơn mới `PENDING`, nguyên liệu đã được **giữ**; khi thanh toán thành công mới trừ tồn thực. Khi hết hạn/hủy trước trả tiền, phần giữ được giải phóng. Đơn cũ `LEGACY` vẫn dùng đường cập nhật `Product.stock` để bảo toàn lịch sử.

Trong UI, người dùng có tối đa hai cơ hội 2 phút: lần đầu và một lần tạo đơn lại. Số lần được ghi trong localStorage, vì vậy đây là giới hạn **trên trình duyệt**, chưa phải giới hạn tài khoản do backend cưỡng chế. Thanh toán có idempotency key để tránh xử lý lặp cho cùng thao tác. Hóa đơn hiển thị qua trang checkout sau khi API trả thành công.

## 5. Theo dõi và xử lý đơn

Khách xem `GET /api/orders/me` và `GET /api/orders/:id` sau khi đăng nhập. Danh sách đơn đang xử lý và chi tiết đơn được hỏi lại mỗi 2 giây. Admin gọi `GET /api/admin/orders` và `/counts` mỗi 2 giây; API chỉ đưa đơn từ `PAID` trở đi lên danh sách quản lý, không đưa `PENDING` chờ khách trả tiền vào quầy. Đây là **polling 2 giây**, không phải WebSocket.

Luồng pha chế: `PAID → PREPARING → READY → COMPLETED`; `CANCELLED` là nhánh hủy được guard bằng quy tắc chuyển trạng thái ở [orders-state.ts](backend/src/modules/orders/orders-state.ts). Hủy đơn đã thanh toán xử lý hoàn nguyên liệu và điểm theo snapshot; cổng thanh toán mô phỏng không thực hiện hoàn tiền ngân hàng thật.

## 6. Quản trị nguyên liệu và công thức

Hai trang [Nguyên liệu](frontend/src/app/admin/ingredients/page.tsx) và [Công thức](frontend/src/app/admin/recipes/page.tsx) lấy dữ liệu thật qua `GET /api/admin/ingredients` và `GET /api/admin/recipes?productId=...&size=...` hoặc `?toppingId=...`. API được bảo vệ bởi JWT và vai trò ADMIN. Trang kho sản phẩm cũ đã bỏ khỏi menu/frontend.

Các API **ghi** để tạo/sửa nguyên liệu, nhập kho và lưu công thức chưa có; các nút tương ứng trên hai trang chưa hoàn thiện nghiệp vụ. Endpoint `PATCH /api/admin/products/:id/stock` còn ở backend cho dữ liệu cũ, không phải thao tác nhập nguyên liệu. Đây là phần nhóm cần hoàn thiện trước khi coi quản lý kho mới đã xong.

## 7. Kiểm thử và vận hành

- CI ở [.github/workflows/ci.yml](.github/workflows/ci.yml) chạy PR vào `main`: mỗi ứng dụng `npm ci`, backend `prisma generate`, rồi lint/build/unit test. CI chưa chạy test DB hoặc E2E và chưa tự triển khai.
- Unit test nằm cạnh module/store; script kiểm tra luồng nguyên liệu có DB thử là `backend/scripts/test-ingredient-flow.ts`. Bộ API ở `tests/` được chạy riêng trên môi trường thử.
- Sau pull có migration mới: build image API, chạy `prisma migrate deploy`, rồi build web và `up -d --wait`. Chỉ chạy `catalog:bootstrap` **một lần** để chuyển DB chưa có 17 nguyên liệu/công thức mẫu; script này cũng bật lại 6 món/3 topping mẫu. Không chạy `db seed` trên DB cần giữ dữ liệu và không dùng `down -v` khi muốn giữ volume.

Các SVG cũ trong `docs/assets` được vẽ trước khi chuyển sang kho nguyên liệu; dùng nội dung tài liệu và code ở trên làm nguồn hiện tại khi cập nhật sơ đồ Assignment 2.
