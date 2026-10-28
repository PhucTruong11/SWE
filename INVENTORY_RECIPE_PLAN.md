# BrewLite: kế hoạch chuyển sang quản lý nguyên liệu và công thức

Cập nhật: 27/10/2026. Trạng thái: **đợt A đã triển khai; đợt B–D đang chờ**.

Tài liệu này mô tả thay đổi từ tồn kho theo số ly sản phẩm sang tồn kho theo nguyên liệu. Phạm vi bao gồm Prisma, PostgreSQL, dữ liệu, menu, giỏ hàng, tạo đơn, checkout, payments và admin. Đợt A đã thêm schema/dữ liệu. Đợt B đã nối giỏ, đơn và thanh toán với nguyên liệu; phần quản trị nhập kho/công thức và dọn trường cũ vẫn còn.

## 1. Quyết định và phạm vi

- Chỉ thêm **hai bảng nghiệp vụ**: `ingredients` và `recipes`. Prisma Migrate tự tạo bảng kỹ thuật `_prisma_migrations` để ghi lịch sử migration; đó không phải bảng nghiệp vụ. Các trạng thái cần thiết cho đơn được thêm vào bảng hiện có; không tạo bảng tồn kho hoặc bảng giữ kho riêng trong giai đoạn này.
- Chỉ **6 sản phẩm và 3 topping đang kinh doanh**. Các bản ghi cũ được đặt `isAvailable = false`, chưa xóa vật lý để giữ lịch sử đơn.
- Công thức pha chế của một sản phẩm giữ cùng loại nguyên liệu ở các size S/M/L; chỉ định lượng thay đổi. Ly là vật tư đóng gói phụ thuộc size: mỗi ly dùng một `CUP_S`, `CUP_M` hoặc `CUP_L`.
- Ly, đá, ống hút và nước đều xuất hiện trong công thức. Ly, đá và ống hút có quản lý tồn. **Nước không quản lý tồn**: `trackStock = false`, `onHand = NULL`, `reserved = NULL`.
- Giỏ hàng kiểm tra nhu cầu nguyên liệu của **toàn bộ giỏ**, không trừ kho khi khách đang chọn món. Tạo đơn giữ nguyên liệu; thanh toán thành công mới trừ tồn thực.
- **Giữ `Product.version`**. Thêm `Ingredient.version` và cập nhật có điều kiện trong transaction để chống hai đơn cùng lấy lượng nguyên liệu còn lại. Chỉ bỏ `Product.stock` sau khi toàn bộ luồng đã chuyển đổi.
- Model `Address` hiện không còn trong Prisma schema. DB BrewLite kiểm tra ngày 27/10/2026 **không còn bảng `addresses`**; nếu DB của thành viên khác vẫn có bảng này thì xóa bằng migration riêng sau khi sao lưu và gỡ các chỗ còn dùng địa chỉ trên frontend.

## 2. Cấu trúc dữ liệu dự kiến

### 2.1. Bảng mới `ingredients`

| Thuộc tính | Kiểu dự kiến | Quy tắc |
| --- | --- | --- |
| `id` | UUID/text, khóa chính | Cùng kiểu định danh với các bảng hiện tại |
| `code` | text, unique | Mã ổn định, ví dụ `COFFEE_BEANS`, `ICE`, `CUP_M` |
| `name` | text | Tên hiển thị cho admin và cảnh báo thiếu hàng |
| `unit` | enum `G`, `ML`, `PIECE` | Đơn vị chuẩn dùng trong công thức và tồn kho |
| `trackStock` | boolean | `false` cho nước; `true` cho nguyên liệu/vật tư cần quản kho |
| `onHand` | decimal, nullable | Lượng tồn thực; `NULL` nếu không quản stock |
| `reserved` | decimal, nullable | Lượng đã giữ cho đơn chờ thanh toán; `NULL` nếu không quản stock |
| `packageQuantity` | decimal, nullable | Quy đổi một bao/can/hộp sang đơn vị chuẩn, ví dụ 10 kg = 10.000 g |
| `lowStockThreshold` | decimal, nullable | Ngưỡng cảnh báo cho admin |
| `version` | integer | Tăng khi tồn/định nghĩa cần kiểm soát đồng thời thay đổi |
| `isActive` | boolean | Cho phép dùng nguyên liệu trong công thức mới |
| `createdAt`, `updatedAt` | timestamp | Theo dõi thay đổi |

`available = onHand - reserved` chỉ áp dụng khi `trackStock = true`. Cần ràng buộc DB để `onHand >= 0`, `reserved >= 0`, `reserved <= onHand`; nếu `trackStock = false` thì cả hai cột phải `NULL`. Với `PIECE`, số lượng tồn và định mức phải là số nguyên. Không dùng `NULL` để biểu diễn "hết hàng".

Danh mục dự kiến: hạt cà phê, đường, sữa đặc, sữa tươi, syrup caramel, trà pha sẵn, syrup đào, sả, đá, ly S/M/L, ống hút, trân châu trắng, thạch cà phê, kem sữa mặn và nước. Topping thành phẩm được xem là nguyên liệu đã chuẩn bị để bán theo phần. Nước vẫn có dòng `ingredients` và các dòng `recipes` tương ứng.

### 2.2. Bảng mới `recipes`

| Thuộc tính | Kiểu dự kiến | Quy tắc |
| --- | --- | --- |
| `id` | UUID/text, khóa chính | Một dòng định lượng |
| `productId` | FK `products.id`, nullable | Có giá trị nếu là công thức món |
| `size` | `ProductSize`, nullable | Bắt buộc khi có `productId` |
| `toppingId` | FK `toppings.id`, nullable | Có giá trị nếu là công thức một phần topping |
| `ingredientId` | FK `ingredients.id` | Nguyên liệu cần dùng |
| `quantity` | decimal dương | Lượng cần cho **một ly** hoặc **một phần topping**, theo `Ingredient.unit` |
| `createdAt`, `updatedAt` | timestamp | Theo dõi sửa định mức |

Một dòng phải thuộc **đúng một** trong `productId` và `toppingId`. Công thức sản phẩm có `size`; công thức topping không có `size`. Cần khóa duy nhất cho `(productId, size, ingredientId)` và `(toppingId, ingredientId)` cùng ràng buộc `quantity > 0`. Prisma có thể cần migration SQL để thể hiện đầy đủ các `CHECK` này.

### 2.3. Bảng hiện có

| Bảng | Thay đổi |
| --- | --- |
| `products` | Giữ tên, mô tả, ảnh, category, `allowToppings`, `isAvailable`, **`version`**. `stock` chỉ còn là trường cũ trong giai đoạn chuyển đổi; bỏ sau khi không còn code nào đọc/ghi. |
| `product_prices` | Giữ giá riêng cho S/M/L; không nhét giá vào công thức. |
| `toppings` | Giữ tên, giá, ảnh, `isAvailable`; bổ sung quan hệ tới `recipes`. |
| `orders` | Thêm `inventoryState` (`LEGACY`, `RESERVED`, `CONSUMED`, `RELEASED`, `RESTORED`) và `reservationExpiresAt`. Đơn cũ là `LEGACY`, không tự hoàn kho từ dữ liệu suy đoán. |
| `order_items` | Thêm `recipeSnapshot` dạng JSONB để cố định mã nguyên liệu, đơn vị và lượng đã giữ cho dòng hàng khi đặt. Giữ thông tin món/size/topping/giá hiện có. |
| `payments` | Giữ `idempotencyKey` unique và trạng thái hiện có; không thêm bảng thanh toán. |
| `addresses` | DB hiện tại không có bảng; nếu môi trường khác còn bảng vật lý thì xóa bằng migration riêng sau khi sao lưu, đồng thời gỡ giao diện profile còn gọi API địa chỉ. |

Quan hệ: `Product 1-N Recipe`, `Topping 1-N Recipe`, `Ingredient 1-N Recipe`, `Order 1-N OrderItem`, `Order 1-N Payment`. Công thức được tính lại từ DB lúc tạo đơn; snapshot bảo vệ đơn khỏi việc admin sửa công thức về sau.

## 3. Danh mục và định lượng mẫu cần nhóm duyệt

Chỉ bật bán: **Phin Đen Đá, Phin Sữa Đá, Bạc Xỉu, Americano, Caramel Macchiato, Trà Thanh Đào**. Chỉ bật ba topping: **Trân Châu Trắng, Thạch Cà Phê, Kem Sữa Mặn**. Tên và định lượng dưới đây là dữ liệu **đề xuất để thử luồng**, không phải công thức đã được cửa hàng xác nhận.

Lượng trong mỗi ô theo thứ tự **S / M / L**, áp dụng cho một ly:

| Sản phẩm | Thành phần pha chế |
| --- | --- |
| Phin Đen Đá | Cà phê `18/24/30 g`; nước `80/110/140 mL`; đường `6/8/10 g` |
| Phin Sữa Đá | Cà phê `18/24/30 g`; nước `70/100/130 mL`; sữa đặc `25/35/45 mL` |
| Bạc Xỉu | Cà phê `8/12/16 g`; nước `30/40/50 mL`; sữa tươi `90/130/170 mL`; sữa đặc `25/35/45 mL` |
| Americano Đá | Cà phê `18/24/30 g`; nước `150/220/290 mL` |
| Caramel Macchiato Đá | Cà phê `16/22/28 g`; nước `30/40/50 mL`; sữa tươi `100/140/180 mL`; syrup caramel `15/20/25 mL` |
| Trà Thanh Đào | Trà pha sẵn `150/220/290 mL`; syrup đào `25/35/45 mL`; đường `5/7/9 g`; sả `5/7/9 g`; nước `30/40/50 mL` |

Mọi ly cộng thêm đá `120/160/200 g`, một ly vật lý đúng size và một ống hút. Một phần topping cộng thêm: Trân Châu Trắng `30 g`; Thạch Cà Phê `30 g`; Kem Sữa Mặn `25 mL`. Khi món không cho topping (`allowToppings = false`), backend phải từ chối topping được gửi lên, kể cả khi client bị sửa thủ công.

Nhập kho dùng đơn vị chuẩn: một bao 10 kg ghi `packageQuantity = 10000` nếu đơn vị là `G`; một can 10 lít ghi `10000` nếu đơn vị là `ML`. Số lượng bao/can/hộp nhập phải được nhân với quy đổi trước khi cộng `onHand`. Không cho nhập kho nước theo API quản stock.

## 4. Thay đổi theo từng phần

### 4.1. Prisma, PostgreSQL và dữ liệu

1. Sao lưu database và kiểm tra có thể khôi phục trên bản sao.
2. Tạo migration có quản lý phiên bản cho hai bảng mới, FK, unique/check constraint và các cột mới của `orders`, `order_items`; giữ `Product.stock` trong migration đầu.
3. Thêm dữ liệu nguyên liệu và công thức bằng thao tác có thể chạy lại mà không xóa đơn, người dùng, voucher hay điểm thưởng. **Không chạy seed hiện tại trên database cần giữ dữ liệu**, vì seed đang xóa rồi tạo lại nhiều bảng.
4. Tắt bán sản phẩm/topping ngoài danh mục mới bằng `isAvailable = false`; không xóa bản ghi đang được lịch sử đơn tham chiếu.
5. Ở môi trường còn `addresses`, xóa bằng migration riêng sau khi sao lưu và gỡ phần profile phụ thuộc địa chỉ. Chỉ bỏ `Product.stock` sau khi toàn bộ backend/frontend đã hết dùng trường này.

### 4.2. Menu và sản phẩm

- API danh mục chỉ trả món/topping đang bán và giá S/M/L. Bestseller và trạng thái còn hàng không được tiếp tục phụ thuộc vĩnh viễn vào `products.stock`.
- Trong giai đoạn đầu, **chưa bật trạng thái còn hàng tính theo nguyên liệu** nếu giỏ/tạo đơn/payments vẫn dùng stock sản phẩm. Chuyển cả luồng sang nguyên liệu cùng một đợt để tránh menu nói còn hàng nhưng checkout dùng quy tắc khác.
- Sau khi chuyển đổi, khả năng bán phụ thuộc đủ mọi nguyên liệu có `trackStock = true` trong công thức món và topping được chọn; nước không giới hạn bán.

### 4.3. Giỏ hàng

- Đề xuất `POST /api/cart/validate`: nhận toàn bộ dòng giỏ (`productId`, `size`, `qty`, `toppingIds` hoặc hợp đồng tên topping được chuẩn hóa), trả tính hợp lệ, giá DB, nguyên liệu thiếu và lượng tối đa có thể mua. Endpoint **không ghi kho**.
- Frontend gọi lại khi thêm/xóa món, đổi size/topping, tăng/giảm số lượng và trước khi sang checkout. Cộng nhu cầu của tất cả dòng trước khi so với `onHand - reserved`; không kiểm tra từng dòng độc lập.
- Tránh xem stock lưu trong localStorage hoặc response cũ là kết luận cuối. Lỗi thiếu nguyên liệu phải nêu rõ món/size và nguyên liệu bị thiếu; không dùng lượng nước `NULL` để báo hết hàng.

### 4.4. Tạo đơn

- `POST /api/orders` vẫn yêu cầu đăng nhập. Backend kiểm tra món/size/topping đang bán, công thức đầy đủ, giá từ DB và lượng tồn theo **toàn bộ giỏ**.
- Trong một transaction, giữ từng nguyên liệu có quản stock bằng cập nhật có điều kiện `onHand - reserved >= required`; xử lý theo thứ tự cố định để giảm deadlock. Nếu một nguyên liệu thiếu hoặc có đơn khác giữ trước, rollback toàn bộ.
- Cùng transaction tạo `Order(PENDING, RESERVED, reservationExpiresAt)` và `OrderItem.recipeSnapshot`. Số ly và điểm thưởng dự kiến không phải nguồn để trừ kho.
- `Product.version` được giữ; xung đột tồn kho chung giữa hai **sản phẩm khác nhau** phải được chặn ở bản ghi `Ingredient`, không thể chỉ dựa vào `Product.version`.

### 4.5. Checkout và payments

- Countdown lấy `reservationExpiresAt` của server làm chuẩn. Nếu có chức năng gia hạn, backend phải gia hạn chỗ giữ hợp lệ; không chỉ đổi localStorage.
- Thanh toán thành công: trong transaction kiểm tra đơn còn `RESERVED`, giảm cả `ingredients.onHand` và `ingredients.reserved` đúng lượng snapshot, ghi `Payment(SUCCESS)`, chuyển đơn `PAID` và `inventoryState = CONSUMED`. Idempotency key và trạng thái đơn ngăn trừ lặp.
- Thanh toán thất bại có thể thử lại khi còn hạn giữ chỗ. Khi quá hạn hoặc hủy trước khi trả tiền, giảm `reserved` và chuyển `inventoryState = RELEASED` đúng một lần. Job hết hạn phải xử lý cả đơn `PENDING` và trường hợp `PAYMENT_FAILED` còn giữ nguyên liệu.
- Nếu có cổng thanh toán thật, kết quả từ cổng và transaction PostgreSQL không thể gộp thành một transaction; cần xử lý callback/retry và đối soát trường hợp cổng báo thành công đúng lúc giữ chỗ hết hạn. Luồng mock hiện tại vẫn phải giữ tính idempotent.

### 4.6. Admin

- Trang kho chuyển từ stock từng sản phẩm sang nguyên liệu: `onHand`, `reserved`, `available`, đơn vị, ngưỡng thiếu và nhập kho theo bao/can/hộp. Nước được hiển thị là "không quản lý tồn", không có nút nhập kho.
- Thêm chức năng sửa công thức món theo S/M/L và công thức một phần topping. Backend kiểm tra đủ định lượng, nguyên liệu đang hoạt động và quy tắc mỗi size chỉ đổi lượng của thành phần pha chế; ly đóng gói tương ứng size.
- Việc sửa công thức chỉ tác động đơn mới. Đơn đã tạo dùng `recipeSnapshot`. Admin hủy đơn `PAID` theo quy tắc hiện hành thì hoàn nguyên liệu từ snapshot đúng một lần; đơn `LEGACY` không tự suy diễn lượng để hoàn.
- Thay API nhập kho sản phẩm hiện tại bằng API nguyên liệu sau khi frontend đã chuyển đổi. Quyền admin, validation số lượng, kiểm soát cập nhật đồng thời và thông báo lỗi vẫn phải được giữ.

## 5. Thứ tự thực hiện và ranh giới chuyển đổi

| Đợt | Có thể hoàn tất riêng | Điều kiện nghiệm thu |
| --- | --- | --- |
| A. Nền dữ liệu — đã làm | Prisma, migration PostgreSQL, dữ liệu 6 món/3 topping và công thức | Dữ liệu hiện có còn nguyên |
| B. Nghiệp vụ nguyên liệu — đã làm | Validation giỏ, reserve khi tạo đơn, consume/release/restore ở checkout/payment/admin | Đã test cạnh tranh đồng thời, hết hạn, trả tiền lặp và hủy trên DB thử |
| C. Giao diện — đang làm | Menu, product detail, cart, checkout dùng nguyên liệu; trang admin Nguyên liệu và Công thức đã gọi API GET thật; trang kho sản phẩm cũ đã bỏ | Thành viên phụ trách cần bổ sung API ghi, validation và kết nối nút nhập kho/lưu công thức |
| D. Dọn dẹp | Bỏ `Product.stock`, xóa bảng `addresses` sau backup và gỡ profile address | Schema, DB, tài liệu, API và frontend nhất quán; lịch sử đơn vẫn xem được |

Đơn mới dùng `ingredients.onHand/reserved`; đơn cũ `inventoryState=LEGACY` vẫn theo đường `Product.stock` khi thanh toán/hủy để bảo toàn lịch sử. Hai trang admin mới chỉ đọc dữ liệu từ `GET /api/admin/ingredients` và `GET /api/admin/recipes`; chưa thể nhập nguyên liệu hoặc lưu công thức. API stock sản phẩm cũ còn ở backend để tương thích, không dùng làm API nhập nguyên liệu. Script `inventory:demo-stock` nạp số lượng mẫu local chỉ khi lượng tồn đang bằng 0. `catalog:bootstrap` chỉ dùng một lần khi chuyển DB vì chạy lại sẽ bật lại 6 món/3 topping mẫu.

## 6. Kiểm thử bắt buộc trước khi bỏ `Product.stock`

- Một nguyên liệu còn đúng đủ cho một đơn: hai khách đồng thời tạo đơn mua hai món khác nhau cùng dùng nguyên liệu đó; chỉ một đơn được giữ thành công.
- Nhiều dòng cùng món khác size/topping và nhiều món dùng chung hạt cà phê/đá/ly: backend cộng nhu cầu toàn giỏ, trả đúng thiếu hụt.
- Nước có `onHand = NULL`: công thức vẫn hiện lượng nước nhưng không làm đơn bị báo hết hàng hoặc cập nhật stock nước.
- Thiếu ly M, đá hoặc topping: chỉ những lựa chọn cần vật tư đó bị chặn; thông báo nói rõ nguyên liệu thiếu.
- Sửa công thức/giá sau khi đã tạo đơn: đơn cũ vẫn thanh toán/hoàn kho theo snapshot và giá đã lưu.
- Thanh toán thành công, thất bại rồi thử lại, gọi cùng idempotency key nhiều lần, gọi key khác trên đơn đã PAID: tồn/điểm/voucher không bị xử lý hai lần.
- Đơn quá hạn và hủy trước thanh toán giải phóng đúng lượng đã giữ; hủy PAID hoàn đúng một lần nếu chính sách cho phép.
- Migration và dữ liệu mẫu chạy trên **bản sao DB thật**: số đơn, người dùng, lịch sử và voucher trước/sau không bị mất; DataGrip phản ánh schema sau refresh.

## 7. Rủi ro và điểm cần xác nhận trước khi đưa dữ liệu mẫu vào DB

| Vấn đề | Cách xử lý |
| --- | --- |
| Định lượng ví dụ khác thực tế | Chủ nhiệm nghiệp vụ duyệt công thức, đơn vị và mức tồn ban đầu trước khi nhập dữ liệu chính thức. |
| Chỉ có hai bảng mới, không có sổ nhập/xuất riêng | Chấp nhận thiếu lịch sử biến động kho chi tiết trong phạm vi hiện tại; ghi nhận nếu Assignment 2 cần audit kho thì bổ sung thiết kế sau. |
| DB của thành viên khác còn `addresses` dù Prisma không còn model | Sao lưu, xác nhận profile không còn dùng và drop bằng migration riêng; không xóa bằng seed hoặc `db push` thiếu kiểm soát. |
| Dữ liệu seed hiện tại có tính phá hủy | Viết thao tác chuyển dữ liệu riêng, có thể chạy lại; không dùng seed cũ trên DB cần giữ. |
| Đổi công thức khi còn đơn chờ | OrderItem snapshot và lượng đã `reserved` là nguồn quyết định cho đơn đó. |
| Hai nguồn tồn kho trong giai đoạn chuyển đổi | Giữ `Product.stock` làm nguồn cũ đến lúc toàn bộ luồng chuyển; không bật từng nửa ở môi trường đang bán. |

Các điểm chưa được chốt là **định lượng thực tế, lượng tồn ban đầu, quy cách nhập từng nguyên liệu và chính sách hoàn nguyên liệu khi hủy đơn PAID**. Việc duyệt các giá trị này chỉ ảnh hưởng dữ liệu/nghiệp vụ; cấu trúc hai bảng và thứ tự triển khai ở trên vẫn dùng được.
