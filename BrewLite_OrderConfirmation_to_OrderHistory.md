# BrewLite — Context bàn giao: Từ Order Confirmation đến Order History

> Mục đích: ghi tiếp flow sau khi người dùng hoàn tất hoặc thử thanh toán tại màn hình Order Confirmation, bảo đảm đơn được lưu ở backend và được phân loại đúng trong trang Lịch sử đơn hàng.
>
> Phạm vi ghi nhận trong tài liệu này dựa trên context được bàn giao. Trước khi sửa code, Codex phải xác minh trạng thái thực tế trong repository; không coi mô tả này là bằng chứng rằng mọi luồng đã được kiểm thử end-to-end.

## 1. Luồng nghiệp vụ cần duy trì

```text
Checkout
  └─ POST /orders
       └─ Backend tạo và lưu Order
            └─ POST /checkout (Idempotency-Key)
                 ├─ Thanh toán thành công
                 │    └─ GET /orders/:id xác minh trạng thái PAID
                 │         └─ Điều hướng đến /orders/:id?confirmed=1
                 │              └─ Người dùng mở Lịch sử đơn hàng /orders
                 │                   └─ GET /orders/me
                 │                        ├─ Đơn đang xử lý
                 │                        └─ Lịch sử đơn hàng
                 └─ Thanh toán lỗi / chưa xác định
                      └─ Giữ giỏ hàng; hiển thị kết quả đúng thực tế
                           └─ Cho phép xem chi tiết / retry theo logic hiện có
                                └─ GET /orders/me phản ánh trạng thái mới nhất
```

### Nguyên tắc dữ liệu

- **Backend/database là nguồn dữ liệu chính.** Order được ghi nhận vào lịch sử thông qua việc backend lưu Order khi tạo đơn và trả dữ liệu từ `GET /orders/me`; frontend không tự tạo một bản ghi lịch sử riêng.
- `GET /orders/me` phải chỉ trả đơn thuộc người dùng hiện tại theo cơ chế xác thực của dự án. Không tự lọc bằng dữ liệu giả hoặc chỉ dựa vào Zustand/localStorage.
- Sau khi chuyển từ Order Confirmation sang Order History, trang lịch sử phải lấy dữ liệu từ API. Khi người dùng quay lại trang hoặc refresh, kết quả cần phản ánh trạng thái mới nhất từ backend.
- Bộ lọc trạng thái trên frontend chỉ quyết định **vị trí hiển thị**, không thay đổi trạng thái Order trong database.
- Không tạo endpoint, bảng database hoặc enum trạng thái mới chỉ để phục vụ việc hiển thị lịch sử nếu repository hiện tại đã hỗ trợ luồng này.

## 2. Trạng thái và quy tắc phân loại

Trong `frontend/src/app/orders/page.tsx`, dùng các nhóm trạng thái sau, nhưng phải đối chiếu với enum/state machine đang có trong source trước khi sửa:

```ts
const ACTIVE_STATUSES = [
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
];

const PAST_STATUSES = [
  'COMPLETED',
  'CANCELLED',
  'PAYMENT_FAILED',
];
```

| Nhóm | Trạng thái | Cách hiển thị |
|---|---|---|
| Đơn hàng đang xử lý | `PENDING`, `PAID`, `PREPARING`, `READY` | Hiển thị section **Đơn hàng đang xử lý** nếu có dữ liệu; dùng phần tử đầu tiên theo logic/layout hiện có làm `activeOrder`, nếu phù hợp với code hiện tại. Các đơn active khác không được âm thầm mất khỏi giao diện nếu trang vốn có hỗ trợ liệt kê nhiều đơn. |
| Lịch sử đơn hàng | `COMPLETED`, `CANCELLED`, `PAYMENT_FAILED` | Chỉ hiển thị các đơn có status thuộc `PAST_STATUSES` trong section **Lịch sử đơn hàng**. Nếu danh sách rỗng, hiển thị **Chưa có đơn hàng trong lịch sử**. |

### Các tình huống cần giữ nhất quán

- `READY` vẫn thuộc nhóm đang xử lý vì khách cần biết đơn đã sẵn sàng nhận.
- `COMPLETED` và `CANCELLED` nằm trong lịch sử.
- `PAYMENT_FAILED` nằm trong lịch sử theo yêu cầu UI hiện tại. Điều này **không** có nghĩa cấm retry: nếu trang chi tiết hiện đã hỗ trợ retry cho `PAYMENT_FAILED`, không được làm mất hành vi đó.
- Nếu một đơn `PAYMENT_FAILED` được retry và backend cập nhật sang `PAID`, `GET /orders/me` ở lần tải tiếp theo phải làm đơn xuất hiện ở nhóm đang xử lý thay vì tiếp tục nằm trong lịch sử.
- Hai nhóm không được hiển thị trùng cùng một Order.
- Nếu source hiện có thêm status hợp lệ ngoài hai mảng trên, Codex phải nêu rõ phát hiện đó và tránh âm thầm làm biến mất đơn; chỉ mở rộng phạm vi phân loại sau khi xác minh ý nghĩa status trong state machine.
- Không suy ra thanh toán thành công từ query `?confirmed=1` hoặc từ điều hướng frontend. Kết quả thành công phải dựa trên response backend đáng tin cậy.

## 3. API và ranh giới trách nhiệm

Theo context hiện tại:

- `POST /orders`: tạo và lưu đơn hàng.
- `POST /checkout`: xử lý thanh toán; gửi header `Idempotency-Key`. Body theo contract hiện tại có `{ orderId, method, promoCode? }` nếu backend thực sự định nghĩa như vậy.
- `GET /orders/me`: tải các đơn của người dùng đang đăng nhập.
- `GET /orders/:id`: tải chi tiết một đơn.

Trước khi sửa, Codex phải đọc DTO, controller, service và cách frontend gọi API để xác nhận chính xác response shape, tên field trạng thái, cấu trúc danh sách và cách xử lý lỗi. Không tự đoán `data`, `orders`, `items` hay các field khác.

Nếu `GET /orders/me` không trả về các đơn `COMPLETED`, `CANCELLED` hoặc `PAYMENT_FAILED` dù database có lưu chúng, cần truy nguyên nguyên nhân trong API/backend và báo rõ. Không thể khắc phục dữ liệu bị backend loại bỏ chỉ bằng cách đổi bộ lọc frontend.

## 4. Yêu cầu giao diện trang Order History

File chính: `frontend/src/app/orders/page.tsx`.

- Giữ nguyên cấu trúc, component, API client, kiểu dữ liệu và conventions đang có nếu chúng phù hợp.
- Phân loại dữ liệu theo `ACTIVE_STATUSES` và `PAST_STATUSES` đã xác minh.
- Nếu có `activeOrders`, hiển thị section **Đơn hàng đang xử lý** theo bố cục hiện có; dùng `activeOrder` là phần tử đầu tiên nếu đây là convention của trang hiện tại.
- Section **Lịch sử đơn hàng** chỉ lọc các đơn thuộc `PAST_STATUSES`.
- Nếu lịch sử rỗng, hiển thị đúng thông báo **Chưa có đơn hàng trong lịch sử**; trạng thái rỗng của lịch sử không được nhầm với lỗi tải API.
- Khi gọi `GET /orders/me` thất bại, hiển thị thông báo lỗi và nút **Thử lại** thực sự gọi lại request. Không hiển thị empty state như thể tải thành công nhưng không có đơn.
- Có loading state trong lúc tải dữ liệu và tránh hiển thị dữ liệu cũ như kết quả mới nếu request thất bại.
- Import và đặt `<CartStickyBar />` ở vị trí phù hợp cuối trang nếu component tồn tại và được các trang tương đương sử dụng. Kiểm tra layout để không render trùng, gây lỗi build hoặc che nội dung.
- Đồng bộ design token đã tồn tại trong dự án: `bg-surface`, `bg-background`, `text-text`, `text-text/60`, `border-primary/15`, `bg-primary`, `hover:bg-primary-hover`. Xác minh các token trong `globals.css`/Tailwind config; không thay hàng loạt class mà làm hỏng contrast hoặc trạng thái tương tác.
- Giữ điều hướng từ mỗi đơn sang đúng `/orders/[id]` theo route và cấu trúc ID mà repository đang sử dụng.

## 5. Checklist nghiệm thu

- [ ] `GET /orders/me` được gọi theo API client/auth convention hiện có.
- [ ] Đơn `PENDING`, `PAID`, `PREPARING`, `READY` được xếp vào Đơn hàng đang xử lý.
- [ ] Đơn `COMPLETED`, `CANCELLED`, `PAYMENT_FAILED` được xếp vào Lịch sử đơn hàng.
- [ ] Không một đơn nào xuất hiện ở cả hai nhóm.
- [ ] Lịch sử rỗng hiển thị đúng thông báo.
- [ ] Lỗi tải lịch sử hiển thị lỗi và nút Thử lại hoạt động.
- [ ] Loading/empty/error được phân biệt rõ.
- [ ] Retry `PAYMENT_FAILED` ở trang chi tiết không bị phá vỡ; sau khi backend cập nhật trạng thái, tải lịch sử sẽ phân loại lại theo status mới.
- [ ] Theme token và `CartStickyBar` được dùng đúng với codebase hiện tại.
- [ ] Chạy các lệnh lint/typecheck/test phù hợp với repository; chỉ báo pass cho lệnh thực sự đã chạy.
- [ ] Không sửa backend hoặc file ngoài phạm vi trừ khi phát hiện blocker có bằng chứng rõ ràng.

---

# Prompt dành cho Codex trong VS Code

Bạn đang làm việc trực tiếp trên repository BrewLite. Hãy sửa **trực tiếp** file `frontend/src/app/orders/page.tsx` để hoàn thiện việc phân loại và hiển thị đơn hàng trong lịch sử. Đọc tài liệu context này trước khi sửa.

## Nhiệm vụ

1. Đọc `frontend/src/app/orders/page.tsx` hiện tại, API client/hook dùng để gọi `GET /orders/me`, type/interface của Order, các status enum/state machine trong backend và component `CartStickyBar`.
2. Xác minh response thực tế của `GET /orders/me`; không đoán cấu trúc dữ liệu, tên field hoặc status.
3. Thiết lập hoặc cập nhật hai nhóm status:
   - `ACTIVE_STATUSES`: `PENDING`, `PAID`, `PREPARING`, `READY`.
   - `PAST_STATUSES`: `COMPLETED`, `CANCELLED`, `PAYMENT_FAILED`.
4. Nếu có `activeOrders`, hiển thị section **Đơn hàng đang xử lý**, giữ bố cục/component hiện có và dùng `activeOrder` là phần tử đầu tiên theo logic cũ nếu phù hợp.
5. Section **Lịch sử đơn hàng** chỉ hiển thị các đơn thuộc `PAST_STATUSES`. Khi không có đơn phù hợp, hiển thị **Chưa có đơn hàng trong lịch sử**.
6. Đảm bảo mỗi đơn chỉ xuất hiện trong một nhóm. `READY` phải được coi là đang xử lý. `PAYMENT_FAILED` phải được liệt kê trong lịch sử nhưng không được làm hỏng chức năng retry ở trang chi tiết hiện có.
7. Bổ sung/giữ loading state, error state và nút **Thử lại** gọi lại API khi `GET /orders/me` thất bại. Không đánh đồng lỗi request với danh sách rỗng.
8. Đồng bộ giao diện theo token thực tế của dự án: `bg-surface`, `bg-background`, `text-text`, `text-text/60`, `border-primary/15`, `bg-primary`, `hover:bg-primary-hover`. Đọc cấu hình theme trước khi dùng class.
9. Bảo đảm `CartStickyBar` được import và đặt đúng vị trí nếu component tồn tại và phù hợp với layout; không tạo component giả hoặc render trùng.
10. Chỉ sửa file khác nếu thật sự cần để xác minh hoặc khắc phục blocker. Không thay đổi endpoint, schema, state machine, thanh toán, promotion, loyalty hay cron job trong task này nếu không có bằng chứng trực tiếp rằng đó là nguyên nhân khiến lịch sử không hiển thị đúng.

## Kiểm chứng dữ liệu

Nếu các đơn thuộc `PAST_STATUSES` không xuất hiện trong response `GET /orders/me`, hãy kiểm tra controller/service backend để xác định chúng có được lưu và có bị lọc khỏi response hay không. Không tuyên bố frontend đã hoàn thiện lưu lịch sử chỉ vì bộ lọc UI đã đổi. Nếu nguyên nhân nằm ngoài phạm vi file được giao, không tự ý refactor diện rộng; báo rõ file, nguyên nhân và cách sửa tối thiểu được đề xuất.

## Kiểm thử và đầu ra

- Chạy lint/typecheck/test phù hợp với script có thật trong `package.json`.
- Kiểm tra tối thiểu phân loại active/past, empty state, error/retry state và điều hướng đến order detail.
- Không tạo mock data để che lỗi API.
- Không tuyên bố test/build thành công nếu chưa chạy hoặc đã thất bại.
- Hoàn tất bằng cách sửa trực tiếp source trong workspace. Sau đó báo ngắn gọn: file đã sửa, quy tắc phân loại đã áp dụng, các lệnh đã chạy cùng kết quả thực tế và blocker còn lại (nếu có).
- Giữ nguyên các hành vi hiện tại không liên quan đến yêu cầu này.
