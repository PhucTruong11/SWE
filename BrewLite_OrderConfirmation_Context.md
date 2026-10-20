# BrewLite - Context bổ sung cho Order Confirmation

## 1. Mục tiêu và căn cứ

Phần này tập trung vào luồng sau khi khách hàng xác nhận checkout: tạo đơn, thanh toán, hiển thị xác nhận đơn hàng và cho phép xem lại lịch sử/chi tiết đơn.

Theo đề bài BrewLite:
- Màn hình xác nhận cần hiển thị mã đơn và trạng thái đơn.
- Khi thanh toán thành công, đơn ở trạng thái `PAID` và khách hàng nhìn thấy màn hình xác nhận.
- Khi thanh toán thất bại, đơn ở trạng thái `PAYMENT_FAILED` và giỏ hàng phải được giữ nguyên.
- Task 9 còn gồm lịch sử đơn hàng qua `GET /orders/me` và bàn giao/demo end-to-end.
- Task 10 yêu cầu state machine, thanh toán idempotent, kiểm soát tồn kho khi đặt đồng thời, khuyến mãi và điểm thưởng.

Tài liệu này là phần bổ sung dựa trên context đã cung cấp; chưa thể xác nhận code thực tế đã hoàn tất nếu chưa kiểm tra repository và test.

## 2. Context hiện có theo thông tin bàn giao

Các mục sau được ghi nhận từ context người dùng cung cấp, cần đối chiếu code để xác nhận:
- Backend đã có `POST /orders`, `GET /orders/me` và `GET /orders/:id`.
- `orders.service.ts` gọi `promotionsService.applyPromotion({ code, subtotal })`.
- Có `orders-state.ts` và unit test `orders-state.spec.ts`.
- Checkout dự kiến gửi `promoCode` nếu người dùng đang áp mã.
- Frontend đang có hoặc dự kiến có trang lịch sử `frontend/src/app/orders/page.tsx`, trang chi tiết `frontend/src/app/orders/[id]/page.tsx`, component `frontend/src/components/orders/OrderStatus.tsx` và checkout `frontend/src/app/checkout/page.tsx`.

Không coi các mục trên là đã được kiểm chứng cho đến khi agent đọc code, DTO, API response và test hiện có.

## 3. Khoảng trống quan trọng của context hiện tại

1. **Chưa xác định màn hình xác nhận đơn riêng hay dùng lại trang chi tiết.** Prompt hiện tại chủ yếu sửa trang lịch sử và chi tiết; chưa định nghĩa rõ trải nghiệm ngay sau khi thanh toán thành công. Agent cần kiểm tra routing trước, ưu tiên tái sử dụng trang phù hợp nếu đã đáp ứng yêu cầu, không tạo route trùng.
2. **Chưa mô tả đầy đủ chuỗi checkout → payment → confirmation.** Cần quy định rằng chỉ gọi thanh toán sau khi tạo đơn thành công; điều hướng sang xác nhận chỉ khi kết quả thanh toán thành công đã được backend xác nhận.
3. **Chưa quy định rõ hành vi khi thanh toán lỗi hoặc request timeout.** Không được xóa giỏ hàng khi thất bại; không được tạo đơn/thanh toán trùng do double-click hoặc retry mạng; cách retry phải tuân theo API và state machine đang có.
4. **Thiếu trạng thái ngoại lệ trong UI.** `OrderStatus` hiện được mô tả với các trạng thái thành công/chờ xử lý, nhưng cần kiểm tra cả `PAYMENT_FAILED` và `CANCELLED` nếu backend sử dụng chúng.
5. **Chưa nêu rõ nguồn dữ liệu khi tải lại trang xác nhận.** Trang cần khôi phục dữ liệu từ API chi tiết đơn có xác thực, không chỉ dựa vào state tạm của checkout hoặc query string.
6. **Chưa khóa hợp đồng dữ liệu thực tế.** Tên field của `CreateOrderDto`, payment DTO và response cần đọc từ code; không tự đoán `id`/`orderId`, `method`, `amount` hay cấu trúc response.
7. **Chưa nhấn mạnh tổng tiền do backend xác định.** Frontend có thể gửi lựa chọn sản phẩm và mã khuyến mãi, nhưng backend phải xác minh lại giá, số lượng, topping/size, ưu đãi và tổng thanh toán trước khi ghi đơn/thanh toán.
8. **Chưa phân tách phạm vi.** UI Order Confirmation/History/Detail không nên tự ý triển khai toàn bộ Loyalty, Cron, Optimistic Locking hoặc viết lại Promotion nếu đó không phải task hiện tại.

## 4. Luồng nghiệp vụ đích

### A. Tạo đơn
1. Khách nhấn xác nhận checkout; frontend chặn double-click bằng trạng thái loading/disabled.
2. Frontend gửi `POST /orders` theo đúng DTO hiện có, kèm `promoCode` khi có mã khuyến mãi.
3. Backend validate đơn, tính lại giá/tổng/discount từ dữ liệu đáng tin cậy, lưu đơn ở trạng thái ban đầu theo contract hiện có (context hiện tại nói là `PENDING`).
4. Nếu tạo đơn thất bại, thông báo lỗi phù hợp; không gọi `POST /payments`, không xóa giỏ hàng.

### B. Thanh toán
1. Chỉ sau khi có response tạo đơn hợp lệ, frontend gọi `POST /payments` theo đúng payment DTO/controller hiện có.
2. Gửi phương thức thanh toán đã chọn và `Idempotency-Key` theo contract của backend. Cùng một thao tác thanh toán được retry do timeout phải dùng lại key đó; không tạo key mới cho mỗi lần render. Tuân theo cơ chế idempotency hiện hữu của dự án.
3. Số tiền thanh toán phải khớp với tổng tiền cuối cùng do backend xác định, bao gồm khuyến mãi hợp lệ; không tin giá tổng do client tự tính.
4. Thành công: backend là nguồn sự thật về trạng thái `PAID`; frontend dùng response hoặc truy vấn `GET /orders/:id` để xác minh trước khi hiển thị xác nhận.
5. Thất bại: hiển thị trạng thái/lỗi phù hợp với response, giữ nguyên giỏ hàng và cho retry chỉ theo khả năng mà API/state machine hiện tại cho phép. Không tự tạo đơn mới trong luồng retry nếu chưa xác minh thiết kế backend.

### C. Xác nhận đơn hàng
Màn hình xác nhận cần:
- Hiển thị rõ thông báo thành công, mã đơn, trạng thái cuối cùng được backend xác nhận và tổng tiền thực tế.
- Dùng đúng ID trả về từ API tạo đơn; không tự tạo mã đơn ở frontend.
- Có đường dẫn hợp lý đến chi tiết đơn/lịch sử và về trang menu theo cấu trúc route hiện có.
- Có loading, lỗi tải dữ liệu, ID không hợp lệ/không tìm thấy, và trường hợp user không có quyền xem đơn.
- Khi refresh hoặc mở lại URL, tải lại dữ liệu từ API chi tiết đơn; bảo đảm backend kiểm tra quyền sở hữu đơn.
- Chỉ xóa/reset giỏ hàng sau khi xác nhận thanh toán thành công theo contract. Không xóa khi tạo đơn thất bại hoặc thanh toán thất bại.

Nếu `orders/[id]` đã là trang chi tiết có thể đáp ứng xác nhận, có thể điều hướng tới trang này và hiển thị banner xác nhận dựa trên trạng thái backend. Chỉ tạo route `order-confirmation` riêng khi dự án thực sự cần và chưa có route phù hợp.

## 5. Trạng thái và UI

Cần giữ đồng bộ giữa state machine backend, status DTO/API và nhãn giao diện:
- `PENDING`: Đang chờ thanh toán/xử lý theo định nghĩa backend.
- `PAID`: Đã thanh toán.
- `PREPARING`: Đang chuẩn bị.
- `READY`: Sẵn sàng nhận.
- `COMPLETED`: Hoàn tất.
- `PAYMENT_FAILED`: Thanh toán thất bại; không biểu diễn như đã thanh toán.
- `CANCELLED`: Đơn đã hủy.

Agent phải xác minh enum/state machine thực tế trước khi thêm hoặc đổi status. Không tự ý thêm trạng thái mới vào Prisma/DB chỉ để phục vụ UI. Với `PAYMENT_FAILED` và `CANCELLED`, không hiển thị stepper tích cực như thể đơn đang tiến triển bình thường; render nhãn/trạng thái ngoại lệ rõ ràng.

## 6. Promotion và tổng tiền

- Gửi `promoCode` từ nguồn state hiện tại (context nói là Zustand) khi có giá trị; không tự tạo một state song song nếu đã có store.
- Backend phải validate điều kiện khuyến mãi, giới hạn giảm giá và tính tổng cuối cùng. `discountAmount` không được vượt `subtotal`; tổng thanh toán không âm.
- `lineTotal`, `subtotal`, `discountAmount` và `total` từ frontend không được mặc nhiên coi là dữ liệu tin cậy để tính tiền.
- Phần Order Confirmation chỉ hiển thị breakdown từ API thực tế. Không tự triển khai lại Promotion trong UI nếu backend đã sở hữu logic này.

## 7. UI/theme và phạm vi sửa file

Các file nằm trong phạm vi theo prompt ban đầu:
- `frontend/src/components/orders/OrderStatus.tsx`
- `frontend/src/app/orders/page.tsx`
- `frontend/src/app/orders/[id]/page.tsx`
- `frontend/src/app/checkout/page.tsx` (chỉ khi cần hoàn chỉnh chuỗi create order/payment/promo)

Yêu cầu theme: ưu tiên token đang có của dự án như `bg-surface`, `bg-background`, `text-text`, `border-primary/15`, `bg-primary/20`; giữ màu trạng thái semantic nếu nó đáp ứng contrast và style hiện tại. Trước khi đổi hàng loạt class, kiểm tra `globals.css`, Tailwind config và cách các trang tương tự đang dùng theme.

`CartStickyBar` chỉ được import từ path thực tế của dự án, không tạo component giả hoặc import sai. Thêm vào trang lịch sử/chi tiết nếu đó đúng là convention hiện hữu và không che nội dung chính. Không mặc định thêm thanh giỏ hàng vào màn hình xác nhận thành công nếu thiết kế hiện tại không dùng nó ở đây.

## 8. Ngoài phạm vi trừ khi được giao riêng

Không tự ý triển khai lại Promotion backend, Loyalty Points, cron hủy đơn, optimistic locking, schema migration hoặc thay đổi payment state machine trong một task UI. Nếu phát hiện thiếu/sai logic backend khiến confirmation không thể hoạt động, nêu file và nguyên nhân, sửa phần tối thiểu cần thiết hoặc báo rõ blocker tùy phạm vi được giao.

## 9. Definition of Done cho phần Order Confirmation

- Tạo đơn thành công → gọi payment đúng contract → xác minh `PAID` → hiển thị mã đơn/trạng thái/tổng tiền.
- Tạo đơn thất bại → không gọi payment; giỏ hàng còn nguyên.
- Payment thất bại → UI không báo thành công; giỏ hàng còn nguyên; retry không sinh thao tác thanh toán trùng.
- Refresh/mở URL xác nhận → tải lại đúng đơn từ API và xử lý loading/error/not-found/unauthorized.
- History và detail lấy dữ liệu từ backend; status label/stepper khớp state machine.
- `promoCode` được gửi khi có; tổng tiền hiển thị khớp API.
- Chạy lint/typecheck/test/build theo scripts hiện có; báo chính xác lệnh nào đã chạy và kết quả. Không tuyên bố pass nếu chưa chạy.
