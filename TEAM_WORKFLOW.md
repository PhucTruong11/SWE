# Hướng dẫn Workflow GitHub & Phân chia Task Nhóm (7 Members)

Tài liệu này hướng dẫn cách đưa code lên GitHub lần đầu và quy trình làm việc nhóm (Git Flow) cho 7 thành viên, đảm bảo code không bị conflict trong quá trình phát triển đồ án BrewLite.

---

## Phần 1: Step-by-step Đẩy code lên GitHub (Lần đầu)

Do dự án đã được `git init` và `git commit` ở máy của bạn (Project Manager/Leader), bạn chỉ cần làm theo các bước sau để đưa lên GitHub:

1. Đăng nhập vào [GitHub](https://github.com/) và tạo một Repository mới (New Repository).
   - Tên repo: `brewlite`
   - Chế độ: `Public` hoặc `Private` tuỳ ý nhóm.
   - **LƯU Ý:** KHÔNG check vào ô *“Add a README file”* hay *“Add .gitignore”* vì code ở máy bạn đã có sẵn những file này.
2. Mở Terminal (PowerShell) tại thư mục gốc của dự án (`d:\Dev\Subject_Uni\SWE\brewlite`) và chạy lần lượt 3 lệnh sau (thay `YOUR_USERNAME` bằng username GitHub của bạn):

```bash
# 1. Thêm đường dẫn tới remote repository
git remote add origin https://github.com/YOUR_USERNAME/brewlite.git

# 2. Đổi tên branch chính mặc định thành 'main'
git branch -M main

# 3. Đẩy code lên GitHub
git push -u origin main
```

---

## Phần 2: Phân chia 7 Nhánh (Branches) cho 7 Thành Viên

Trong mô hình Agile, **KHÔNG AI code trực tiếp trên nhánh `main`**. Nhánh `main` chỉ chứa code đã hoàn thiện và chạy không có lỗi. 

Mỗi thành viên khi làm task của mình sẽ tạo một nhánh riêng (prefix `feature/...`). Dưới đây là phân chia cụ thể cho 7 công việc:

| Thành viên | Tên Công việc (Task) | Tên Nhánh (Branch Name) | Trách nhiệm chính (Frontend & Backend) |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Home** (Trang chủ) | `feature/home-page` | Giao diện giới thiệu quán, các món nổi bật (Best sellers), Footer, Header layout. |
| **Member 2** | **Login & Auth** | `feature/auth-login` | Trang Đăng nhập/Đăng ký, xử lý Auth State (Zustand), gọi API `/auth/login`, cấp phát JWT. |
| **Member 3** | **Menu** (Danh sách món) | `feature/menu-display` | Giao diện danh sách sản phẩm, gọi API `/products`, xử lý tìm kiếm/lọc món (nếu có). |
| **Member 4** | **Cart & Checkout** (Giỏ hàng) | `feature/cart-management` | Quản lý logic Thêm/Bớt/Xóa món trong giỏ, tính tổng tiền (dùng Zustand đã setup). |
| **Member 5** | **Voucher & Loyalty** | `feature/voucher-loyalty` | UI/Logic nhập mã giảm giá, kiểm tra điểm thưởng của user, trừ tiền khi áp dụng voucher. |
| **Member 6** | **Xác nhận & Nhận đồ uống** | `feature/order-confirmation` | Gọi API tạo đơn (`/orders`), màn hình theo dõi trạng thái đơn (`PENDING` -> `PREPARING` -> `READY`). |
| **Member 7** | **Payments** (Thanh toán) | `feature/payments` | Tích hợp giao diện chọn phương thức thanh toán (Tiền mặt / E-Wallet), mock logic thanh toán thành công/thất bại. |

---

## Phần 3: Workflow Làm việc Hàng Ngày (Cho từng thành viên)

Mỗi khi một thành viên (ví dụ Member 2 làm Login) bắt đầu làm việc, phải tuân thủ đúng 4 bước sau:

### Bước 1: Kéo code mới nhất từ main về máy
```bash
# Đảm bảo đang ở nhánh main
git checkout main

# Kéo code mới nhất do các bạn khác đã làm
git pull origin main
```

### Bước 2: Tạo nhánh riêng và bắt đầu code
```bash
# Tạo nhánh mới và nhảy sang nhánh đó luôn
git checkout -b feature/auth-login
```
*(Thành viên code, chỉnh sửa file, test giao diện và backend trên máy cá nhân)*

### Bước 3: Lưu lại thay đổi (Commit & Push)
```bash
# Add tất cả các file đã sửa
git add .

# Ghi chú lại mình đã làm gì
git commit -m "feat: design login UI and connect backend"

# Đẩy nhánh của mình lên GitHub
git push origin feature/auth-login
```

### Bước 4: Tạo Pull Request (PR) để gộp code
1. Thành viên lên GitHub, sẽ thấy nút **"Compare & pull request"** màu xanh. Click vào nút đó.
2. Đặt tiêu đề cho Pull Request (Ví dụ: *"Hoàn thành giao diện Đăng nhập"*).
3. (Tùy chọn) Yêu cầu Leader hoặc thành viên khác Review code.
4. Nhấn **"Merge pull request"** để gộp code của nhánh `feature/auth-login` vào nhánh `main`.

> [!WARNING]
> **Quy tắc sinh tồn:** 
> 1. Mỗi người CHỈ sửa code trong phạm vi chức năng của mình, hạn chế tối đa việc sửa file của người khác để tránh Conflict.
> 2. Nếu cài thêm thư viện mới (ví dụ `npm install react-icons`), phải báo cho cả nhóm để mọi người chạy lệnh `npm install` lại khi pull code mới về.
