# KẾ HOẠCH TRIỂN KHAI TASK 4 VÀ TASK 5 - BREWLITE
> Môn học: Công nghệ Phần mềm (Software Engineering) - Trường Đại học Sài Gòn  
> Đề tài: BrewLite – Requirements to Deployment (Ver 1.0)  
> Phạm vi tài liệu: Kế hoạch hành động chi tiết cho Task 4 và Task 5  
> Trọng tâm nghiệp vụ: Phân hệ Đặt và Thanh toán đơn hàng (Payment & Checkout)

---

## MỤC LỤC
1. [Mục tiêu và Định hướng trọng tâm](#1-mục-tiêu-và-định-hướng-trọng-tâm)
2. [Chi tiết triển khai Task 4 - Sprint 1 và Continuous Integration](#2-chi-tiết-triển-khai-task-4---sprint-1-và-continuous-integration)
   - [Task 4.1: Thiết lập repository và quy trình làm việc](#task-41-thiết-lập-repository-và-quy-trình-làm-việc)
   - [Task 4.2: Tổ chức và quản lý tài liệu](#task-42-tổ-chức-và-quản-lý-tài-liệu)
   - [Task 4.3: Rà soát và hoàn thiện MVP Sprint 1](#task-43-rà-soát-và-hoàn-thiện-mvp-sprint-1)
   - [Task 4.4: Thiết lập quy trình Continuous Integration (CI)](#task-44-thiết-lập-quy-trình-continuous-integration-ci)
3. [Chi tiết triển khai Task 5 - Sprint 2, Docker, CI/CD và Delivery](#3-chi-tiết-triển-khai-task-5---sprint-2-docker-cicd-và-delivery)
   - [Task 5.1: Hoàn thiện nghiệp vụ thanh toán end-to-end](#task-51-hoàn-thiện-nghiệp-vụ-thanh-toán-end-to-end)
   - [Task 5.2: Tích hợp, kiểm thử và đóng gói Docker](#task-52-tích-hợp-kiểm-thử-và-đóng-gói-docker)
   - [Task 5.3: Thiết lập quy trình Continuous Delivery / Deployment (CD)](#task-53-thiết-lập-quy-trình-continuous-delivery--deployment-cd)
   - [Task 5.4: Triển khai Production và bàn giao sản phẩm](#task-54-triển-khai-production-và-bàn-giao-sản-phẩm)
4. [Bảng tổng hợp các hạng mục cần triển khai thêm vào dự án](#4-bảng-tổng-hợp-các-hạng-mục-cần-triển-khai-thêm-vào-dự-án)

---

## 1. MỤC TIÊU VÀ ĐỊNH HƯỚNG TRỌNG TÂM

Tài liệu này tập trung lập kế hoạch cụ thể cho hai task thực thi kỹ thuật của Assignment 2:
* Task 4 (Sprint 1): Chuẩn hóa kho lưu trữ, nạp tài liệu Task 1 đến Task 3 vào hệ thống quản lý phiên bản, kiểm tra MVP đầu tiên cho luồng xem menu, và xây dựng pipeline Continuous Integration (CI) tự động.
* Task 5 (Sprint 2): Hoàn thiện toàn bộ luồng nghiệp vụ end-to-end với trọng tâm là phân hệ Thanh toán (Payment), thiết lập bộ kiểm thử tự động, đóng gói ứng dụng bằng Docker Compose, xây dựng pipeline Continuous Delivery (CD) và triển khai hệ thống lên môi trường Production có HTTPS.

Toàn bộ các yêu cầu kiểm thử, đóng gói và triển khai được xây dựng xoay quanh luồng nghiệp vụ cốt lõi: Khách hàng chọn món -> Khởi tạo đơn hàng PENDING -> Áp dụng khuyến mãi -> Thanh toán qua cổng mô phỏng có Idempotency-Key -> Trừ tồn kho nguyên tử -> Cập nhật trạng thái PAID -> Hiển thị biên nhận và tra cứu lịch sử đơn hàng.

---

## 2. CHI TIẾT TRIỂN KHAI TASK 4 - SPRINT 1 VÀ CONTINUOUS INTEGRATION

### Task 4.1: Thiết lập repository và quy trình làm việc

Mục tiêu: Đảm bảo kho mã nguồn được tổ chức chuyên nghiệp, có cơ chế quản lý phiên bản rõ ràng và đáp ứng các tiêu chuẩn kỹ thuật phần mềm.

Các nội dung cần triển khai thêm vào repository:
1. Chuẩn hóa cấu trúc thư mục:
   * Tổ chức rõ ràng các phân vùng: thư mục mã nguồn giao diện (frontend), thư mục mã nguồn dịch vụ backend (backend), thư mục tài liệu kỹ thuật (docs), và thư mục cấu hình luồng tự động (.github/workflows).
2. Xây dựng chiến lược phân nhánh (Branching Strategy):
   * Nhánh main: Nhánh lưu trữ mã nguồn chính thức, được bảo vệ bằng Branch Protection Rules (chặn push trực tiếp, bắt buộc phải thông qua Pull Request và vượt qua pipeline kiểm tra tự động).
   * Nhánh develop: Nhánh tích hợp chung của nhóm trong quá trình phát triển các Sprint.
   * Các nhánh tính năng (feature branches): Đặt tên theo tiền tố thống nhất, ví dụ feature/payment-gateway, feature/docker-setup, chore/ci-pipeline.
3. Quy ước thông điệp commit (Conventional Commits):
   * Thống nhất cú pháp commit bắt buộc cho toàn bộ thành viên trong nhóm: `<type>(<scope>): <mô tả ngắn gọn>`.
   * Các loại tiền tố quy chuẩn:
     * feat: Thêm tính năng mới (ví dụ: feat(payment): add mock payment processor).
     * fix: Sửa lỗi (ví dụ: fix(checkout): correct voucher discount rounding).
     * test: Thêm hoặc chỉnh sửa kiểm thử tự động (ví dụ: test(payment): add unit tests for idempotency).
     * docs: Cập nhật tài liệu (ví dụ: docs(traceability): update requirement mapping matrix).
     * ci: Cấu hình liên quan đến pipeline CI/CD (ví dụ: ci: add automated test execution step).
4. Thiết lập Issue Board và Product Backlog:
   * Tạo GitHub Project hoặc Issue Board trên kho lưu trữ của nhóm.
   * Phân chia rõ hai cột mốc (Milestones):
     * Milestone Sprint 1: Thiết lập cấu trúc repo, hoàn thiện tài liệu phân tích Task 1 đến Task 3, API danh mục món uống, xây dựng pipeline CI cơ bản.
     * Milestone Sprint 2: Hoàn thiện tính năng thanh toán, xây dựng bộ test tự động, cấu hình Docker Compose, xây dựng pipeline CD và triển khai Production.
5. Quy định Định nghĩa hoàn thành (Definition of Done - DoD):
   * Mã nguồn không còn lỗi linter và đáp ứng kiểm tra cú pháp TypeScript.
   * Tính năng mới phải có kiểm thử tự động đi kèm và chạy đạt 100%.
   * Pull Request phải được ít nhất một thành viên khác trong nhóm xem xét (review) và phê duyệt.
   * Pipeline CI phải chạy thành công trước khi gộp vào nhánh chính.

---

### Task 4.2: Tổ chức và quản lý tài liệu

Mục tiêu: Đưa toàn bộ các tạo phẩm thiết kế từ Task 1 đến Task 3 vào kho mã nguồn để kiểm soát lịch sử thay đổi thông qua Git.

Cấu trúc thư mục tài liệu cần tạo mới trong repository:
* docs/requirements/: Chứa tài liệu bối cảnh phạm vi (context-and-scope.md) và tài liệu đặc tả yêu cầu rút gọn (srs.md).
* docs/diagrams/: Chứa toàn bộ sơ đồ Activity, Sequence, Class, Deployment ở cả hai định dạng: tệp mã nguồn (PlantUML hoặc Mermaid) và tệp hình ảnh xuất ra (SVG hoặc PNG).
* docs/architecture/: Chứa tài liệu mô tả kiến trúc tổng thể (system-architecture.md) và thư mục con adr/ chứa các bản ghi quyết định kiến trúc kỹ thuật.
* docs/traceability-matrix.md: Ma trận truy vết bắt buộc liên kết giữa yêu cầu, use-case, sơ đồ, API và mã kiểm thử.
* docs/deployment.md: Tài liệu đặc tả kiến trúc triển khai thực tế và quy trình vận hành.

Quy định quản lý: Mọi cập nhật liên quan đến yêu cầu hoặc thiết kế kiến trúc đều phải được thực hiện thông qua commit và Pull Request có giải trình lý do rõ ràng.

---

### Task 4.3: Rà soát và hoàn thiện MVP Sprint 1

Mục tiêu: Đảm bảo luồng xem danh mục sản phẩm hoạt động ổn định trên cả giao diện và API để làm nền tảng cho Sprint 2.

Các hạng mục cần rà soát:
1. Phía Backend:
   * Đảm bảo API lấy danh sách sản phẩm (GET /api/products) và API chi tiết sản phẩm (GET /api/products/:id) hoạt động chính xác.
   * Đảm bảo tập lệnh khởi tạo dữ liệu mẫu (prisma/seed.ts) có thể tái tạo đầy đủ danh mục món uống, các kích cỡ (size) và topping kèm theo.
2. Phía Frontend:
   * Giao diện danh mục món uống được thiết kế theo định hướng Mobile-first, hiển thị tối ưu trên thiết bị di động và máy tính bảng.
   * Xử lý đầy đủ ba trạng thái giao diện bắt buộc: Trạng thái đang tải dữ liệu (Loading skeleton), trạng thái danh sách rỗng (Empty state), và trạng thái xảy ra lỗi kết nối (Error banner kèm nút thử lại).
3. Kiểm thử tối thiểu:
   * Có ít nhất một kịch bản kiểm thử tự động xác nhận API trả về đúng cấu trúc dữ liệu của sản phẩm.

---

### Task 4.4: Thiết lập quy trình Continuous Integration (CI)

Mục tiêu: Tự động hóa quy trình kiểm tra chất lượng mã nguồn mỗi khi có yêu cầu gộp nhánh (Pull Request), ngăn chặn mã nguồn lỗi lọt vào nhánh chính.

Các nội dung cần triển khai thêm vào pipeline CI (.github/workflows/ci.yml):
1. Bổ sung các bước kiểm tra tự động:
   * Bước 1: Tải mã nguồn từ repository (Checkout).
   * Bước 2: Thiết lập môi trường thực thi Node.js phiên bản 20.
   * Bước 3: Cài đặt thư viện phụ thuộc cho cả Frontend và Backend.
   * Bước 4: Khởi tạo Prisma Client để đồng bộ lược đồ dữ liệu.
   * Bước 5: Kiểm tra tiêu chuẩn cú pháp và phong cách mã nguồn (Linting).
   * Bước 6: Thực thi tự động toàn bộ test suite (Bổ sung lệnh chạy Unit Test, hiện tại pipeline chưa có bước này).
   * Bước 7: Biên dịch kiểm tra lỗi hệ thống (Build) cho cả NestJS và Next.js.
2. Quy định bắt buộc:
   * Cấu hình branch protection rule trên GitHub để cấm thao tác merge nếu pipeline CI có bất kỳ bước nào thất bại.
3. Kế hoạch chuẩn bị minh chứng nộp bài (Theo yêu cầu mục 6.4 trong đề bài):
   * Minh chứng 1: Tạo một Pull Request hợp lệ, chụp ảnh màn hình hoặc lưu log chứng minh toàn bộ các bước kiểm tra đều đạt (màu xanh).
   * Minh chứng 2: Cố tình tạo một thay đổi gây lỗi (ví dụ viết sai một assertion trong file kiểm thử hoặc cố tình vi phạm quy tắc linter), mở Pull Request để pipeline phát hiện lỗi và chặn không cho merge (màu đỏ). Chụp ảnh màn hình làm minh chứng.

---

## 3. CHI TIẾT TRIỂN KHAI TASK 5 - SPRINT 2, DOCKER, CI/CD VÀ DELIVERY

### Task 5.1: Hoàn thiện nghiệp vụ thanh toán end-to-end

Mục tiêu: Kết nối hoàn chỉnh toàn bộ luồng nghiệp vụ từ chọn món đến thanh toán và tra cứu đơn hàng, tập trung vào phân hệ Thanh toán.

Nội dung nghiệp vụ cần củng cố và hoàn thiện:
1. Khởi tạo đơn hàng tạm tính:
   * Nhận danh sách món, kích cỡ, topping từ giỏ hàng.
   * Kiểm tra tồn kho tại thời điểm đặt đơn.
   * Lưu bản ghi đơn hàng với trạng thái ban đầu là PENDING và tính tổng tiền chính xác.
2. Xử lý thanh toán an toàn:
   * Tiếp nhận yêu cầu thanh toán kèm mã đơn hàng, phương thức (thẻ ngân hàng, ví điện tử, tiền mặt) và mã giảm giá (voucher).
   * Tái kiểm tra điều kiện áp dụng mã giảm giá (giá trị đơn tối thiểu, số tiền chiết khấu tối đa) để chống gian lận thay đổi dữ liệu từ phía client.
   * Gửi thông tin sang dịch vụ thanh toán mô phỏng (Mock Payment Gateway) để xác thực giao dịch.
   * Áp dụng cơ chế giao dịch cơ sở dữ liệu (Database Transaction): Khi thanh toán thành công, thực hiện đồng thời việc trừ số lượng sản phẩm trong kho và chuyển trạng thái đơn hàng sang PAID.
3. Cơ chế chống thanh toán trùng lặp (Idempotency):
   * Tiếp nhận khóa định danh duy nhất (Idempotency-Key) được sinh ra từ Frontend cho mỗi phiên thanh toán.
   * Nếu client gửi lại cùng một khóa định danh do mạng trễ hoặc người dùng bấm nhiều lần, hệ thống nhận diện và trả về kết quả thanh toán trước đó mà không thực hiện trừ tiền hoặc trừ kho lần thứ hai.
4. Xác nhận và lịch sử đơn hàng:
   * Trả về thông tin biên nhận chi tiết sau khi thanh toán hoàn tất.
   * Cập nhật danh sách đơn hàng đã mua để người dùng có thể tra cứu trạng thái trong mục Lịch sử đơn hàng.

---

### Task 5.2: Tích hợp, kiểm thử và đóng gói Docker

Mục tiêu: Đảm bảo chất lượng phần mềm qua các cấp độ kiểm thử tự động, cung cấp endpoint giám sát hệ thống, và đóng gói ứng dụng hoạt động nhất quán trên mọi môi trường qua Docker.

Các hạng mục kỹ thuật cần triển khai thêm:

1. Xây dựng Endpoint Health Check:
   * Bổ sung route GET /api/health tại Backend.
   * Mục đích: Cho phép Docker container, bộ cân bằng tải và pipeline CI/CD kiểm tra tình trạng sống của máy chủ.
   * Nội dung phản hồi: Trạng thái tổng thể của API, thời gian hoạt động liên tục (uptime), và kết quả kiểm tra kết nối trực tiếp đến cơ sở dữ liệu PostgreSQL.

2. Xây dựng bộ kiểm thử tự động tập trung vào phân hệ Thanh toán:
   * Kiểm thử đơn vị (Unit Test - checkout.service.spec.ts):
     * Kiểm thử hàm tính toán chiết khấu voucher cố định và voucher phần trăm.
     * Kiểm thử giới hạn mức giảm giá tối đa (maxDiscount).
     * Kiểm thử điều kiện giá trị đơn hàng tối thiểu (minOrderValue).
     * Kiểm thử các trường hợp ngoại lệ: mã không tồn tại, mã đã ngừng hoạt động, đơn hàng không đủ điều kiện.
   * Kiểm thử tích hợp (Integration Test - payment.integration-spec.ts):
     * Kiểm thử luồng gọi API khởi tạo đơn hàng POST /api/orders.
     * Kiểm thử gọi API thanh toán POST /api/checkout với thông tin hợp lệ, kiểm tra trạng thái đơn chuyển sang PAID và tồn kho bị trừ tương ứng.
     * Kiểm thử cơ chế Idempotency với cùng một khóa thanh toán gửi lặp.
   * Kiểm thử luồng đầu cuối (End-to-End Test):
     * Kịch bản tự động mô phỏng thao tác: Mở trang chủ -> Chọn sản phẩm -> Thêm vào giỏ -> Mở trang thanh toán -> Xác nhận đặt hàng -> Kiểm tra đơn hàng được ghi nhận trong cơ sở dữ liệu.

3. Đóng gói Container với Docker:
   * Xây dựng backend/Dockerfile: Áp dụng kỹ thuật Multi-stage build (stage biên dịch TypeScript và sinh Prisma Client; stage thực thi production chỉ giữ lại các thư viện cần thiết nhằm tối ưu dung lượng).
   * Xây dựng frontend/Dockerfile: Áp dụng kỹ thuật Multi-stage build kết hợp tính năng Next.js Standalone nhằm giảm kích thước container xuống dưới mức 150MB.
   * Xây dựng docker-compose.yml tại thư mục gốc của dự án:
     * Dịch vụ db: Chạy PostgreSQL 16 Alpine, gắn volume lưu trữ dữ liệu bền vững, có cấu hình healthcheck kiểm tra trạng thái sẵn sàng nhận kết nối.
     * Dịch vụ api: Chạy Backend NestJS, phụ thuộc vào trạng thái khỏe mạnh của db, tự động thực thi lệnh cập nhật lược đồ dữ liệu (prisma migrate deploy) và nạp dữ liệu mẫu (prisma db seed) trước khi khởi chạy dịch vụ.
     * Dịch vụ web: Chạy Frontend Next.js, kết nối nội bộ đến dịch vụ api.
   * Tiêu chí nghiệm thu: Bất kỳ ai tải mã nguồn về chỉ cần thực thi một lệnh "docker compose up --build" là toàn bộ hệ thống gồm 3 thành phần tự động khởi chạy và sử dụng được ngay.

---

### Task 5.3: Thiết lập quy trình Continuous Delivery / Deployment (CD)

Mục tiêu: Tự động hóa toàn bộ quá trình đóng gói và phát hành phiên bản mới lên môi trường Production mỗi khi có thay đổi được phê duyệt trên nhánh chính.

Các nội dung cần triển khai thêm vào pipeline CD (.github/workflows/cd.yml):
1. Điều kiện kích hoạt:
   * Tự động chạy khi có sự kiện đẩy mã nguồn lên nhánh main hoặc khi tạo thẻ phiên bản mới (Release Tag theo chuẩn v*.*.*).
2. Các giai đoạn thực thi trong pipeline:
   * Giai đoạn 1 - Quality Gate: Chạy kiểm tra lint, toàn bộ unit test và build thử nghiệm để đảm bảo tính toàn vẹn của mã nguồn.
   * Giai đoạn 2 - Đóng gói Container Image: Tự động đóng gói mã nguồn thành Docker image, gán nhãn bằng mã băm commit SHA và số hiệu phiên bản.
   * Giai đoạn 3 - Lưu trữ Container Registry: Đẩy image đã đóng gói lên kho lưu trữ GitHub Container Registry (GHCR) hoặc Docker Hub.
   * Giai đoạn 4 - Triển khai tự động (Deploy): Kích hoạt lệnh triển khai trên nền tảng đám mây bằng cách sử dụng Webhook hoặc Secret Deploy Hook được lưu trữ an toàn trong GitHub Secrets.
   * Giai đoạn 5 - Thực thi Migration an toàn: Máy chủ production tự động chạy migration để cập nhật cấu trúc bảng dữ liệu trước khi dịch vụ mới bắt đầu nhận request.
   * Giai đoạn 6 - Kiểm tra sau triển khai (Smoke Test): Pipeline gửi yêu cầu tự động đến endpoint GET /api/health của môi trường live. Nếu kết quả không đạt, gửi cảnh báo tức thì để thực hiện hoàn nguyên.
3. Cơ chế Rollback:
   * Xây dựng tài liệu hướng dẫn quy trình khôi phục nhanh về bản phát hành ổn định trước đó khi phiên bản mới gặp sự cố nghiêm trọng trên production.

---

### Task 5.4: Triển khai Production và bàn giao sản phẩm

Mục tiêu: Đưa ứng dụng lên môi trường vận hành thực tế có thể truy cập công khai, đảm bảo tính an toàn và chuẩn bị đầy đủ hồ sơ bàn giao.

Các tiêu chí bàn giao bắt buộc:
1. Hạ tầng triển khai thực tế có chứng chỉ HTTPS:
   * Backend API và PostgreSQL: Triển khai trên nền tảng đám mây Render (cung cấp đường dẫn HTTPS công khai cho API và kiểm tra sức khỏe). Cơ sở dữ liệu PostgreSQL được bảo vệ trong mạng nội bộ, không mở cổng public trực tiếp ra Internet.
   * Frontend: Triển khai trên nền tảng Vercel (kết nối trực tiếp với kho mã nguồn GitHub, cấu hình biến môi trường kết nối đến Backend Render qua HTTPS).
2. Bảo mật biến môi trường và thông tin nhạy cảm:
   * Toàn bộ chuỗi kết nối cơ sở dữ liệu, khóa bí mật JWT, cổng thanh toán tuyệt đối không được xuất hiện trong kho mã nguồn hoặc trong log của CI/CD. Quản lý tập trung qua biến môi trường của nền tảng đám mây và GitHub Secrets.
3. Phát hành phiên bản và tài liệu bàn giao:
   * Tạo Release Tag (ví dụ v1.0.0) trên GitHub đính kèm tài liệu tóm tắt các tính năng phát hành (Release Notes).
   * Cập nhật tệp README.md: Hướng dẫn chi tiết cách chạy ứng dụng ở môi trường cục bộ bằng Docker Compose, hướng dẫn chạy kiểm thử, danh sách URL production, và quy trình thực hiện rollback.
4. Video minh chứng và Đánh giá quy trình:
   * Ghi hình video trực tiếp luồng nghiệp vụ từ đầu đến cuối (thời lượng 3 đến 5 phút): Xem danh mục món -> Chọn món và topping -> Thêm giỏ -> Áp dụng mã giảm giá -> Thanh toán -> Xem lịch sử đơn hàng và kiểm tra số lượng tồn kho đã được cập nhật chính xác.
   * Biên bản họp đánh giá kết quả Sprint 2 (Sprint Review) và đúc kết kinh nghiệm cải tiến quy trình kỹ thuật phần mềm của nhóm (Sprint Retrospective).

---

## 4. BẢNG TỔNG HỢP CÁC HẠNG MỤC CẦN TRIỂN KHAI THÊM VÀO DỰ ÁN

Dưới đây là danh sách cụ thể các tập tin và cấu hình nhóm cần tạo mới hoặc bổ sung vào dự án để hoàn thành trọn vẹn Task 4 và Task 5:

| STT | Nhóm nhiệm vụ | Tên tập tin / Thư mục | Nội dung cần thực hiện | Thuộc Task |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Quản lý tài liệu | docs/ | Tạo thư mục docs/ và nạp đầy đủ tài liệu đặc tả, sơ đồ, ma trận truy vết từ Task 1 đến Task 3 | Task 4.2 |
| 2 | Quy trình dự án | GitHub Projects / Issues | Khởi tạo bảng công việc và phân chia 2 Milestone cho Sprint 1 và Sprint 2 | Task 4.1 |
| 3 | Tích hợp liên tục | .github/workflows/ci.yml | Bổ sung bước chạy kiểm thử tự động (npm test) cho Backend vào luồng kiểm tra Pull Request | Task 4.4 |
| 4 | Minh chứng CI | Báo cáo / Ảnh chụp | Thực hiện 1 Pull Request thành công và 1 Pull Request thất bại để chụp ảnh minh chứng khả năng chặn lỗi của CI | Task 4.4 |
| 5 | Giám sát hệ thống | backend/src/modules/health/ | Cài đặt endpoint GET /api/health kiểm tra trạng thái máy chủ và kết nối cơ sở dữ liệu | Task 5.2 |
| 6 | Kiểm thử đơn vị | backend/src/modules/checkout/checkout.service.spec.ts | Viết Unit Test cho nghiệp vụ tính toán chiết khấu voucher, kiểm tra điều kiện áp dụng và xử lý ngoại lệ | Task 5.2 |
| 7 | Kiểm thử tích hợp | backend/test/payment.integration-spec.ts | Viết Integration Test cho luồng tạo đơn hàng, thanh toán trừ kho và kiểm tra tính năng chống trùng lặp Idempotency | Task 5.2 |
| 8 | Đóng gói Backend | backend/Dockerfile | Xây dựng tệp Dockerfile đa tầng (Multi-stage build) cho dịch vụ NestJS | Task 5.2 |
| 9 | Đóng gói Frontend | frontend/Dockerfile | Xây dựng tệp Dockerfile đa tầng sử dụng chế độ Next.js Standalone tối ưu kích thước container | Task 5.2 |
| 10 | Đóng gói hệ thống | docker-compose.yml | Xây dựng tệp Docker Compose ở thư mục gốc liên kết trọn gói 3 dịch vụ database, api, web và tự động chạy migration | Task 5.2 |
| 11 | Triển khai tự động | .github/workflows/cd.yml | Xây dựng pipeline tự động đóng gói image, đẩy lên registry, trigger deploy lên Cloud và chạy smoke test | Task 5.3 |
| 12 | Triển khai đám mây | Render và Vercel | Triển khai live hệ thống với URL HTTPS công khai cho cả Frontend và Backend API | Task 5.4 |
| 13 | Tài liệu vận hành | README.md | Bổ sung hướng dẫn chạy ứng dụng bằng Docker Compose, danh sách live URL, hướng dẫn test và quy trình rollback | Task 5.4 |
| 14 | Hồ sơ phát hành | GitHub Release v1.0.0 | Gắn nhãn phiên bản, soạn thảo Release Notes, video quay luồng nghiệp vụ và biên bản Sprint Retrospective | Task 5.4 |

---
(Kế hoạch chi tiết này được lưu trực tiếp tại file ASSIGNMENT2_PLAN.md ở thư mục gốc để nhóm cùng theo dõi, phân chia công việc và thực hiện tuần tự).
