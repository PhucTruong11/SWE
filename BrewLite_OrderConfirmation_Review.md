# BrewLite - Gap Review & Acceptance Checklist cho Order Confirmation

## 1. Kết luận review

**Context hiện tại chưa đủ để xem phần Order Confirmation đã hoàn chỉnh.** Nó mô tả tương đối rõ các API đơn hàng, Promotion và yêu cầu chỉnh theme cho History/Detail, nhưng chưa khóa acceptance criteria cho màn hình xác nhận sau thanh toán và các nhánh lỗi.

Đây là review trên tài liệu được cung cấp, không phải xác nhận tình trạng code thật. Muốn kết luận implementation đã xong, cần đọc repository, chạy test và kiểm tra end-to-end.

## 2. Đã được đề cập

- `POST /orders`, `GET /orders/me`, `GET /orders/:id`.
- Mã khuyến mãi gửi trong request tạo đơn.
- `promotionsService.applyPromotion({ code, subtotal })` được gọi từ `orders.service.ts` theo context bàn giao.
- Dự kiến sửa theme cho trang History, Detail và `OrderStatus`.
- Checkout cần gọi `POST /payments` và gửi `Idempotency-Key`.

## 3. Cần bổ sung/kiểm chứng trước khi giao AI sửa code

| Hạng mục | Tình trạng trong context | Bổ sung/kiểm chứng cần làm |
|---|---|---|
| Màn hình xác nhận ngay sau thanh toán | Chưa định nghĩa rõ | Chọn tái sử dụng trang Detail hay route hiện có; không tạo route trùng. Hiển thị mã đơn, trạng thái, tổng tiền. |
| Điều hướng sau checkout | Chưa rõ | Chỉ đi tới xác nhận sau khi backend xác nhận thanh toán thành công. |
| Payment failure | Có nhắc trong đề nhưng chưa có chi tiết UI | Không báo thành công, giữ giỏ hàng, cung cấp retry theo API/state machine. |
| Idempotency | Chỉ nhắc header | Retry cho cùng thao tác dùng cùng key; chặn double-click; không tự tạo payment trùng. |
| Khôi phục sau refresh | Chưa đề cập | Lấy order ID thật và đọc lại `GET /orders/:id`, có loading/error/not-found/unauthorized. |
| Trạng thái đặc biệt | Chưa đầy đủ trong mapping màu | Xác minh và xử lý `PAYMENT_FAILED`, `CANCELLED` nếu có trong enum backend. |
| Giá và khuyến mãi | Validation được nêu một phần | Backend xác minh lại giá và total; UI hiển thị số tiền từ API, không tin tổng tự tính ở client. |
| Quyền xem đơn | Chưa đề cập | Không cho xem order của user khác; kiểm tra auth/ownership trong backend và xử lý 401/403 ở UI. |
| CartStickyBar | Được yêu cầu thêm | Xác minh component/path/convention; không để thanh che nút hoặc nội dung và không thêm vào confirmation một cách máy móc. |
| Kiểm chứng kết quả | Chưa có test plan | Chạy scripts hiện hữu và test các nhánh thành công, thất bại, refresh, retry, empty/error state. |

## 4. Acceptance checklist / test cases

### Happy path
- [ ] Checkout gửi đúng payload theo `CreateOrderDto`; có `promoCode` khi đang áp dụng mã.
- [ ] Tạo đơn trả về ID thật và trạng thái ban đầu theo backend.
- [ ] Payment chỉ được gọi sau khi tạo đơn thành công.
- [ ] Payment thành công → backend xác nhận `PAID` → hiển thị mã đơn, trạng thái và tổng cuối cùng.
- [ ] Làm mới trang xác nhận vẫn tải đúng thông tin đơn từ API.
- [ ] Đơn xuất hiện trong `GET /orders/me`; bấm vào mở đúng trang chi tiết.

### Failure / recovery
- [ ] Tạo đơn lỗi → không gọi payment và không xóa cart.
- [ ] Payment trả thất bại → không hiển thị banner thành công và không xóa cart.
- [ ] Nhấn nút nhiều lần nhanh → UI không gửi nhiều thao tác ngoài ý muốn.
- [ ] Timeout/lỗi mạng rồi retry → tuân theo hợp đồng idempotency của backend, không tự sinh payment trùng.
- [ ] Đơn `PAYMENT_FAILED`/`CANCELLED` hiển thị đúng nhãn và không dùng stepper thành công sai lệch.
- [ ] ID không hợp lệ, order không tồn tại hoặc user không có quyền → hiển thị trạng thái phù hợp, không lộ dữ liệu.

### Theme / regression
- [ ] History/Detail dùng đúng token theme và vẫn đọc được ở các trạng thái loading, empty, error.
- [ ] `OrderStatus` bao phủ mọi trạng thái hợp lệ của backend.
- [ ] `CartStickyBar` không che nội dung, không nhân đôi và không được import từ path không tồn tại.
- [ ] Checkout, lịch sử, chi tiết và navigation khác không bị regression.
- [ ] Đã chạy các lệnh test/lint/typecheck/build có sẵn; ghi rõ lệnh và kết quả thực tế.

## 5. Những contract chưa thể tự đoán

Trước khi implement, phải đọc code thực tế để xác định:
- Route xác nhận/route chi tiết đang tồn tại và cách routing của Next.js trong phiên bản dự án.
- Shape response thực tế của `POST /orders`, `POST /payments` và `GET /orders/:id`.
- Payment DTO, tên trường payment method, nguồn total chính thức và format lỗi.
- Cách backend lưu/kiểm tra `Idempotency-Key` và quy tắc retry của `PAYMENT_FAILED`.
- Nguồn trạng thái cart/promo trong Zustand và hành động reset cart hiện tại.
- Path và props của `CartStickyBar`, token CSS/Tailwind thực tế.

Không tự bổ sung field, route, enum hoặc package mới khi chưa có bằng chứng trong code.
