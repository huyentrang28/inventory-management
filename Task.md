XÂY DỰNG WEBSITE QUẢN LÝ XUẤT NHẬP TỒN KHO FULL-STACK

1. VAI TRÒ VÀ MỤC TIÊU

Bạn là một đội ngũ chuyên gia phát triển phần mềm gồm:

* Senior Software Architect
* Senior Python FastAPI Backend Developer
* Senior React TypeScript Frontend Developer
* PostgreSQL Database Architect
* Senior UI/UX Designer
* DevOps / Docker Engineer
* QA Automation Engineer

Hãy xây dựng một hệ thống Warehouse & Inventory Management System (WMS) hoàn chỉnh, có thể triển khai thực tế cho doanh nghiệp vừa và nhỏ tại Việt Nam.

Hệ thống phải quản lý được sản phẩm, nhiều kho hàng, nhập kho, xuất kho, chuyển kho, kiểm kê, nhà cung cấp, khách hàng, người dùng, phân quyền, báo cáo và lịch sử giao dịch.

Mục tiêu cuối cùng:

1. Giao diện đẹp, hiện đại, chuyên nghiệp, dễ sử dụng.
2. Backend Python FastAPI có kiến trúc rõ ràng.
3. PostgreSQL làm database chính.
4. Toàn bộ nghiệp vụ sử dụng API thật và dữ liệu thật.
5. Quản lý tồn kho chính xác, không bị âm kho hoặc ghi nhận trùng.
6. Đóng gói toàn bộ hệ thống bằng Docker.
7. Có thể chạy hệ thống bằng docker compose up -d --build.
8. Dễ bảo trì, mở rộng và triển khai lên VPS Ubuntu.

Không chỉ tạo bản demo giao diện. Hãy xây dựng ứng dụng full-stack hoạt động end-to-end.

⸻

2. TECH STACK BẮT BUỘC

Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Lucide React
* React Router
* TanStack Query
* TanStack Table
* React Hook Form
* Zod
* Zustand
* Axios
* Recharts
* date-fns

Backend

* Python 3.12+
* FastAPI
* SQLAlchemy 2.0 Async
* Pydantic v2
* asyncpg
* Alembic
* JWT Authentication
* RBAC Authorization
* Pytest
* Uvicorn
* Structured Logging

Database

* PostgreSQL 17
* Redis cho cache và các tác vụ phù hợp
* Database transactions
* Indexes
* Foreign Keys
* Constraints
* Persistent storage

Deployment

* Docker
* Docker Compose
* Multi-stage Docker builds
* Nginx
* Environment Variables
* Health Checks
* Persistent Volumes

Không tự ý thay thế tech stack nếu không có lý do kỹ thuật rõ ràng.

⸻

3. BẮT BUỘC SỬ DỤNG SKILL UI-UX-PRO-MAX

Trước khi viết bất kỳ giao diện frontend nào:

1. Kiểm tra skill ui-ux-pro-max đã được cài trong môi trường AI Coding Agent hay chưa.
2. Đọc đầy đủ hướng dẫn của skill.
3. Sử dụng skill để nghiên cứu và lựa chọn phong cách thiết kế phù hợp.
4. Áp dụng design system nhất quán cho toàn bộ website.
5. Kiểm tra lại các màn hình theo nguyên tắc UX của skill.

Nếu skill chưa được cài đặt, phải thông báo và hướng dẫn cách cài đặt phù hợp với môi trường hiện tại. Không được tuyên bố đã sử dụng skill khi chưa thực sự đọc và áp dụng.

Phong cách thiết kế

Modern Enterprise SaaS Dashboard.

Tham khảo phong cách:

* Linear
* Vercel Dashboard
* Notion
* Stripe Dashboard
* Các hệ thống ERP chuyên nghiệp

Thiết kế phải mang cảm giác của một sản phẩm SaaS thương mại, không phải dashboard mẫu đơn giản.

Design System

* Primary: Indigo / Blue
* Success: Emerald
* Warning: Amber
* Danger: Red
* Neutral: Slate
* Font: Inter
* Border radius: 8–12px
* Spacing: 4px / 8px system
* Light Mode / Dark Mode
* Responsive Desktop / Tablet / Mobile

Yêu cầu UX

* Sidebar có thể thu gọn.
* Topbar có breadcrumb, tìm kiếm, thông báo và tài khoản.
* Bảng dữ liệu có sorting, filtering, pagination.
* Các form có validation rõ ràng.
* Dialog xác nhận các thao tác quan trọng.
* Toast thông báo thành công hoặc thất bại.
* Skeleton loading.
* Empty states.
* Error states.
* Trạng thái nút khi đang xử lý.
* Keyboard accessibility.
* Hover, focus và active states.
* Không lạm dụng animation.
* Không dùng quá nhiều gradient.
* Hạn chế layout rối mắt.

Toàn bộ giao diện sử dụng tiếng Việt.

Định dạng:

* Tiền tệ: VND
* Ngày: DD/MM/YYYY
* Thời gian: múi giờ Việt Nam
* Số lượng: định dạng theo đơn vị tính

⸻

4. LAYOUT WEBSITE

Sidebar

Các menu:

1. Tổng quan
2. Sản phẩm
3. Danh mục sản phẩm
4. Quản lý kho
5. Tồn kho
6. Nhập kho
7. Xuất kho
8. Chuyển kho
9. Kiểm kê kho
10. Nhà cung cấp
11. Khách hàng
12. Báo cáo thống kê
13. Người dùng
14. Vai trò và phân quyền
15. Nhật ký hoạt động
16. Cài đặt

Sidebar phải hỗ trợ:

* Thu gọn / mở rộng
* Highlight menu đang chọn
* Menu nhóm có submenu
* Icon Lucide
* Responsive mobile drawer

Topbar

* Breadcrumb
* Global search
* Notification dropdown
* Theme toggle
* User avatar
* Profile dropdown
* Logout

Nội dung chính

* Page title
* Page description
* Primary action
* Filter toolbar
* Data table hoặc dashboard
* Pagination
* Responsive layout

⸻

5. MODULE DASHBOARD

Tạo dashboard tổng quan với các KPI:

* Tổng số sản phẩm
* Tổng số kho
* Tổng số lượng tồn kho
* Tổng giá trị tồn kho
* Tổng nhập trong tháng
* Tổng xuất trong tháng
* Số sản phẩm sắp hết hàng
* Số sản phẩm hết hàng
* Phiếu nhập chờ duyệt
* Phiếu xuất chờ duyệt

Biểu đồ:

* Nhập/xuất theo thời gian
* Top 10 sản phẩm xuất nhiều nhất
* Tồn kho theo danh mục
* Giá trị tồn kho theo từng kho

Có bộ lọc:

* Hôm nay
* 7 ngày
* 30 ngày
* Tháng này
* Khoảng ngày tùy chỉnh
* Theo kho

Dữ liệu phải lấy từ backend, không hardcode.

⸻

6. MODULE QUẢN LÝ SẢN PHẨM

Thông tin sản phẩm:

* ID
* SKU duy nhất
* Barcode
* Tên sản phẩm
* Danh mục
* Đơn vị tính
* Giá nhập tham khảo
* Giá bán tham khảo
* Tồn kho tối thiểu
* Hình ảnh
* Mô tả
* Trạng thái
* Ngày tạo
* Ngày cập nhật

Chức năng:

* Thêm sản phẩm
* Sửa sản phẩm
* Xem chi tiết
* Ngừng kinh doanh / lưu trữ sản phẩm
* Tìm kiếm
* Lọc danh mục
* Lọc trạng thái
* Import Excel
* Export Excel
* Upload hình ảnh
* Xem lịch sử nhập xuất
* Xem tồn kho theo từng kho

Không cho xóa cứng sản phẩm đã phát sinh giao dịch kho.

⸻

7. MODULE QUẢN LÝ KHO

Thông tin:

* Mã kho
* Tên kho
* Địa chỉ
* Người quản lý
* Số điện thoại
* Mô tả
* Trạng thái

Chức năng:

* CRUD kho
* Danh sách sản phẩm trong kho
* Tồn kho theo kho
* Giá trị tồn kho
* Lịch sử giao dịch
* Lọc theo kho

Hỗ trợ nhiều kho độc lập.

Không cho xóa cứng kho đã phát sinh giao dịch.

⸻

8. MODULE NHẬP KHO

Thông tin phiếu nhập

* Mã phiếu nhập tự động
* Ngày nhập
* Kho nhận
* Nhà cung cấp
* Người lập phiếu
* Người duyệt
* Ghi chú
* Danh sách sản phẩm
* Số lượng
* Đơn giá nhập
* Thành tiền
* Tổng tiền
* Trạng thái

Quy trình

Draft → Pending Approval → Approved → Completed

Hỗ trợ Rejected và Cancelled theo các chuyển trạng thái hợp lệ.

Chức năng

* Tạo phiếu nhập
* Sửa phiếu nháp
* Thêm nhiều sản phẩm
* Xóa dòng sản phẩm
* Tự động tính tổng tiền
* Gửi duyệt
* Duyệt / từ chối
* Hoàn tất nhập kho
* Xem chi tiết
* In phiếu
* Xuất PDF

Business Rules

* Số lượng nhập phải lớn hơn 0.
* Đơn giá không được âm.
* Chỉ cộng tồn kho khi phiếu được hoàn tất.
* Không cho hoàn tất phiếu hai lần.
* Không sửa trực tiếp phiếu đã hoàn tất.
* Mọi thay đổi tồn kho phải ghi vào inventory_transactions.
* Cập nhật tồn kho và nhật ký giao dịch trong cùng database transaction.

⸻

9. MODULE XUẤT KHO

Thông tin phiếu xuất

* Mã phiếu xuất tự động
* Ngày xuất
* Kho xuất
* Khách hàng
* Người lập
* Người duyệt
* Danh sách sản phẩm
* Số lượng xuất
* Đơn giá
* Tổng tiền
* Lý do xuất
* Ghi chú
* Trạng thái

Chức năng

* Tạo phiếu xuất
* Sửa phiếu nháp
* Gửi duyệt
* Duyệt / từ chối
* Hoàn tất xuất
* Kiểm tra tồn kho
* In phiếu
* Xuất PDF

Business Rules

* Không cho xuất vượt tồn kho khả dụng.
* Không cho xuất số lượng âm hoặc bằng 0.
* Phải kiểm tra tồn kho lại khi hoàn tất.
* Trừ tồn kho trong database transaction.
* Sử dụng row-level locking hoặc atomic conditional update.
* Chống concurrent requests gây âm kho.
* Không trừ tồn kho hai lần khi retry API.
* Ghi nhận đầy đủ lịch sử xuất kho.

⸻

10. MODULE CHUYỂN KHO

Cho phép chuyển sản phẩm giữa các kho.

Thông tin:

* Mã phiếu chuyển
* Kho nguồn
* Kho đích
* Ngày chuyển
* Người thực hiện
* Danh sách sản phẩm
* Số lượng
* Trạng thái
* Ghi chú

Quy trình:
Draft → Pending Approval → Approved → In Transit → Received

Yêu cầu:

* Kho nguồn và kho đích phải khác nhau.
* Không chuyển vượt tồn khả dụng.
* Khi xuất chuyển, trừ kho nguồn.
* Khi nhận hàng, cộng kho đích.
* Theo dõi hàng đang vận chuyển.
* Xử lý hủy và hoàn trả theo nghiệp vụ bù trừ.
* Không nhân đôi tồn kho khi retry.

⸻

11. MODULE KIỂM KÊ

Chức năng:

* Tạo đợt kiểm kê
* Chọn kho
* Chọn sản phẩm
* Ghi nhận số lượng thực tế
* So sánh với số lượng hệ thống
* Tính chênh lệch
* Nhập lý do chênh lệch
* Gửi duyệt
* Duyệt điều chỉnh
* Hoàn tất kiểm kê

Yêu cầu:

* Lưu snapshot tồn kho tại thời điểm bắt đầu kiểm kê.
* Có cơ chế phát hiện giao dịch phát sinh trong quá trình kiểm kê.
* Không ghi đè tồn kho bằng số lượng kiểm đếm cũ.
* Ghi nhận điều chỉnh bằng inventory transaction.
* Lưu lịch sử đầy đủ.

⸻

12. MODULE NHÀ CUNG CẤP VÀ KHÁCH HÀNG

Thông tin:

* Mã đối tác
* Tên
* Số điện thoại
* Email
* Địa chỉ
* Mã số thuế
* Người liên hệ
* Ghi chú
* Trạng thái

Chức năng:

* CRUD
* Search
* Filter
* Pagination
* Lịch sử giao dịch

⸻

13. MODULE BÁO CÁO

Báo cáo bắt buộc:

* Báo cáo nhập kho
* Báo cáo xuất kho
* Báo cáo tồn kho
* Báo cáo nhập xuất tồn
* Báo cáo giá trị tồn kho
* Báo cáo sản phẩm sắp hết hàng
* Báo cáo lịch sử giao dịch
* Báo cáo kiểm kê
* Báo cáo chuyển kho

Bộ lọc:

* Ngày bắt đầu
* Ngày kết thúc
* Kho
* Danh mục
* Sản phẩm
* Trạng thái

Hỗ trợ:

* Biểu đồ Recharts
* Bảng dữ liệu
* Export Excel
* Export PDF
* In báo cáo

Báo cáo phải sử dụng dữ liệu từ PostgreSQL.

⸻

14. AUTHENTICATION VÀ RBAC

Sử dụng JWT Authentication.

Chức năng:

* Login
* Logout
* Refresh Token
* Change Password
* Current User Profile
* User Management
* Role Management
* Permission Management

Vai trò:

* Admin
* Warehouse Manager
* Warehouse Staff
* Sales Staff
* Viewer

Phân quyền theo hành động:

* View
* Create
* Update
* Approve
* Complete
* Cancel
* Export
* Manage

Backend phải kiểm tra quyền thực tế trên API.

Sử dụng:

* Argon2 password hashing
* Access token ngắn hạn
* Refresh token rotation
* Refresh token revocation
* Rate limiting
* Secure cookies hoặc cơ chế lưu token an toàn phù hợp
* Audit logging cho các hành động quan trọng

Không lưu mật khẩu dạng plain text.

⸻

15. POSTGRESQL DATABASE DESIGN

Bắt buộc sử dụng PostgreSQL 17. Không sử dụng SQLite hoặc MySQL.

Sử dụng:

* SQLAlchemy 2.0 Async
* asyncpg
* Alembic
* PostgreSQL transactions
* Indexes
* Foreign Keys
* Check Constraints
* Unique Constraints
* Connection Pooling

Các bảng chính

Authentication:

* users
* roles
* permissions
* user_roles
* role_permissions
* refresh_tokens

Master Data:

* products
* categories
* units
* warehouses
* suppliers
* customers

Inventory:

* inventory_balances
* inventory_transactions

Inbound:

* stock_receipts
* stock_receipt_items

Outbound:

* stock_issues
* stock_issue_items

Transfer:

* stock_transfers
* stock_transfer_items

Stock Count:

* stock_counts
* stock_count_items

System:

* audit_logs
* system_settings

Nguyên tắc Database

* Primary Key rõ ràng.
* Foreign Key đầy đủ.
* SKU duy nhất.
* Mã chứng từ duy nhất.
* Numeric/Decimal cho tiền và số lượng.
* Không dùng Float cho tiền.
* created_at, updated_at.
* created_by, approved_by.
* Timezone-aware timestamps.
* Soft delete hoặc trạng thái lưu trữ khi phù hợp.
* Tạo Alembic migrations.

Inventory Engine

Thiết kế một inventory service tập trung.

Không cho frontend hoặc các CRUD API cập nhật trực tiếp inventory_balances.

Mọi thay đổi tồn kho phải đi qua inventory service.

inventory_transactions là nhật ký biến động bất biến.

inventory_balances lưu số dư hiện tại để truy vấn nhanh.

Mỗi nghiệp vụ phải đảm bảo:

* Atomicity
* Consistency
* Isolation phù hợp
* Durability
* Idempotency

Sử dụng SELECT FOR UPDATE hoặc atomic updates để tránh race conditions.

Thiết lập unique business reference để chống ghi nhận trùng.

Định nghĩa phương pháp tính giá trị tồn kho, mặc định bình quân gia quyền.

Xây dựng test cho trường hợp hai người cùng xuất một sản phẩm tại cùng thời điểm.

⸻

16. BACKEND FASTAPI ARCHITECTURE

Sử dụng cấu trúc:

backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── permissions.py
│   │   └── logging.py
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── products.py
│   │       ├── categories.py
│   │       ├── warehouses.py
│   │       ├── inventory.py
│   │       ├── receipts.py
│   │       ├── issues.py
│   │       ├── transfers.py
│   │       ├── stock_counts.py
│   │       ├── suppliers.py
│   │       ├── customers.py
│   │       └── reports.py
│   ├── models/
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   ├── dependencies/
│   └── utils/
├── alembic/
├── tests/
├── Dockerfile
├── .dockerignore
└── requirements.txt

Coding Standards

* Clean Architecture.
* Modular Design.
* Dependency Injection.
* Type Hints.
* Async database operations.
* Pydantic validation.
* Centralized exception handling.
* Standardized API responses.
* Pagination.
* Filtering.
* Sorting.
* Structured logging.
* OpenAPI documentation.

API Endpoints

Thiết kế RESTful API với prefix /api/v1.

Ví dụ:

POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
GET    /api/v1/products
POST   /api/v1/products
GET    /api/v1/products/{id}
PATCH  /api/v1/products/{id}
GET    /api/v1/warehouses
POST   /api/v1/warehouses
GET    /api/v1/inventory
GET    /api/v1/inventory/transactions
GET    /api/v1/receipts
POST   /api/v1/receipts
POST   /api/v1/receipts/{id}/submit
POST   /api/v1/receipts/{id}/approve
POST   /api/v1/receipts/{id}/complete
GET    /api/v1/issues
POST   /api/v1/issues
POST   /api/v1/issues/{id}/submit
POST   /api/v1/issues/{id}/approve
POST   /api/v1/issues/{id}/complete
GET    /api/v1/transfers
POST   /api/v1/transfers
GET    /api/v1/reports/inventory
GET    /api/v1/reports/stock-movement
GET    /api/v1/dashboard/summary

Bổ sung đầy đủ endpoints cho các module còn lại.

Không chỉ tạo endpoint mẫu.

⸻

17. FRONTEND REACT ARCHITECTURE

frontend/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── common/
│   │   └── charts/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── warehouses/
│   │   ├── inventory/
│   │   ├── receipts/
│   │   ├── issues/
│   │   ├── transfers/
│   │   ├── stock-counts/
│   │   ├── suppliers/
│   │   ├── customers/
│   │   ├── reports/
│   │   └── users/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── types/
│   ├── routes/
│   ├── lib/
│   └── styles/
├── Dockerfile
├── .dockerignore
├── nginx.conf
└── package.json

Frontend Requirements

* Reusable components.
* Type-safe API clients.
* Protected routes.
* Permission-based navigation.
* React Hook Form + Zod.
* TanStack Query caching.
* TanStack Table.
* Server-side pagination.
* Debounced search.
* Optimistic updates chỉ khi an toàn.
* Loading states.
* Error states.
* Empty states.
* Responsive layout.

Không dùng mock data cho các chức năng đã tích hợp.

⸻

18. CÁC TRANG BẮT BUỘC

Triển khai đầy đủ:

1. Login
2. Dashboard
3. Product List
4. Product Create/Edit
5. Product Detail
6. Category Management
7. Warehouse Management
8. Inventory Overview
9. Inventory Transactions
10. Stock Receipt List
11. Create Stock Receipt
12. Stock Receipt Detail
13. Stock Issue List
14. Create Stock Issue
15. Stock Issue Detail
16. Stock Transfer List
17. Create Stock Transfer
18. Stock Transfer Detail
19. Stock Count List
20. Stock Count Detail
21. Supplier Management
22. Customer Management
23. Reports & Analytics
24. User Management
25. Role & Permission Management
26. Audit Logs
27. Settings

Mỗi trang phải có giao diện hoàn chỉnh, kết nối API thật và xử lý lỗi.

⸻

19. DOCKER — ĐÓNG GÓI TOÀN BỘ HỆ THỐNG

Bắt buộc đóng gói toàn bộ hệ thống bằng Docker Compose.

Kiến trúc:

              USER / BROWSER
                     |
                     v
              NGINX :80/443
                     |
           +---------+---------+
           |                   |
           v                   v
      REACT FRONTEND      FASTAPI BACKEND
       Static Assets          :8000
                                   |
                           +-------+-------+
                           |               |
                           v               v
                      POSTGRESQL         REDIS
                         :5432           :6379
                           |
                           v
                    PERSISTENT VOLUME

Docker Services

frontend

* React build.
* Nginx Alpine.
* Multi-stage Dockerfile.
* Serve static assets.
* SPA fallback.
* Reverse proxy /api sang backend.

backend

* Python slim image.
* FastAPI.
* Uvicorn.
* Non-root user.
* Health check.
* Environment configuration.
* Production mode.

postgres

* PostgreSQL 17.
* Persistent named volume.
* Health check.
* Internal Docker network.
* Không public database port trong production.

redis

* Redis.
* Internal Docker network.
* Health check.
* Không public Redis port.

migrate

* One-off service chạy Alembic migrations.
* Phải hoàn tất trước khi backend phục vụ requests.
* Không chạy migrations đồng thời từ nhiều backend replicas.

Docker Compose Requirements

* docker-compose.yml cho production.
* docker-compose.dev.yml cho development.
* Health checks.
* Restart policies.
* Named volumes.
* Internal networks.
* Environment variables.
* Log rotation.
* Resource limits phù hợp.
* Không hardcode secrets.
* Không mất dữ liệu khi rebuild container.

Docker Backend

Tạo Dockerfile tối ưu:

* Sử dụng Python slim.
* Cache dependencies.
* Chạy non-root.
* Không dùng --reload trong production.
* Không copy .env vào image.
* Health endpoint /health.

Docker Frontend

Sử dụng multi-stage build:

Stage 1:

* Node.js
* Install dependencies
* Build Vite production

Stage 2:

* Nginx Alpine
* Copy dist
* Serve SPA
* Proxy /api sang backend

Docker Commands

Hệ thống phải chạy được bằng:

docker compose up -d --build

Các lệnh khác:

# Xem containers
docker compose ps
# Xem logs
docker compose logs -f
# Rebuild backend
docker compose up -d --build backend
# Chạy migrations
docker compose run --rm migrate
# Dừng hệ thống
docker compose down

Không sử dụng docker compose down -v trong quy trình cập nhật thông thường.

⸻

20. ENVIRONMENT CONFIGURATION

Tạo .env.example với các biến:

APP_NAME=Warehouse Management System
APP_ENV=production
DEBUG=false
POSTGRES_DB=warehouse_db
POSTGRES_USER=warehouse_user
POSTGRES_PASSWORD=change_me
DATABASE_URL=postgresql+asyncpg://warehouse_user:change_me@postgres:5432/warehouse_db
REDIS_URL=redis://redis:6379/0
JWT_SECRET_KEY=replace_with_secure_random_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
TZ=Asia/Ho_Chi_Minh

Đảm bảo:

* .env nằm trong .gitignore.
* Không commit credentials.
* Production secrets phải được thay đổi.
* Các giá trị nhạy cảm phải được validate khi startup.
* Database connection URL phải khớp với credentials của PostgreSQL container.
* Không sử dụng credentials demo trong production.

⸻

21. BACKUP VÀ RESTORE POSTGRESQL

Tạo scripts:

scripts/
├── backup-db.sh
├── restore-db.sh
├── init-db.sh
└── health-check.sh

Yêu cầu:

* Backup bằng pg_dump.
* Restore bằng pg_restore hoặc psql tùy định dạng.
* Backup filename có timestamp.
* Có hướng dẫn backup định kỳ.
* Có hướng dẫn restore.
* Kiểm tra backup có thể phục hồi.
* Không lưu file backup thật vào Git.
* Không tự động xóa database production.

⸻

22. TESTING VÀ QUALITY ASSURANCE

Backend Testing

Sử dụng Pytest.

Test:

* Authentication.
* RBAC.
* Product CRUD.
* Warehouse CRUD.
* Nhập kho.
* Xuất kho.
* Chuyển kho.
* Kiểm kê.
* Không xuất vượt tồn.
* Concurrent stock issue.
* Idempotent completion.
* Transaction rollback.
* Inventory reconciliation.
* Báo cáo nhập xuất tồn.

Frontend Testing

Kiểm thử:

* Login flow.
* Protected routes.
* Product form.
* Stock receipt creation.
* Stock issue creation.
* Approval workflow.
* Validation.
* API error handling.

Docker Testing

Kiểm tra:

* Build thành công.
* Containers healthy.
* Database migrations thành công.
* Frontend truy cập được.
* API hoạt động.
* PostgreSQL kết nối được.
* Restart không mất dữ liệu.
* Rebuild không mất dữ liệu.

Không tuyên bố test đã thành công nếu chưa thực sự chạy.

⸻

23. CẤU TRÚC DỰ ÁN CUỐI CÙNG

warehouse-management/
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   └── package.json
│
├── scripts/
│   ├── backup-db.sh
│   ├── restore-db.sh
│   ├── init-db.sh
│   └── health-check.sh
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
└── README.md

⸻

24. QUY TRÌNH TRIỂN KHAI

Thực hiện theo các phase.

Phase 1 — Architecture & Planning

* Kiểm tra repository.
* Kiểm tra skill ui-ux-pro-max.
* Phân tích nghiệp vụ.
* Thiết kế ERD.
* Thiết kế API contracts.
* Thiết kế RBAC.
* Thiết kế inventory engine.
* Tạo project structure.

Phase 2 — Database & Backend Foundation

* PostgreSQL.
* SQLAlchemy.
* Alembic.
* FastAPI.
* Authentication.
* RBAC.
* Base models.
* API foundation.

Phase 3 — Inventory Core

* Products.
* Categories.
* Warehouses.
* Inventory balances.
* Inventory transactions.
* Stock receipts.
* Stock issues.
* Stock transfers.
* Stock counts.
* Business rules.
* Transaction safety tests.

Phase 4 — UI/UX & Frontend

* Áp dụng ui-ux-pro-max.
* Design system.
* App shell.
* Sidebar.
* Topbar.
* Dashboard.
* Data tables.
* Forms.
* Dialogs.
* Module pages.
* API integration.

Phase 5 — Reports & Advanced Features

* Dashboard analytics.
* Inventory reports.
* Import/export Excel.
* PDF reports.
* Audit logs.
* Settings.

Phase 6 — Docker & Deployment

* Backend Dockerfile.
* Frontend Dockerfile.
* Nginx config.
* PostgreSQL service.
* Redis service.
* Migration service.
* Docker Compose.
* Persistent volumes.
* Environment configuration.

Phase 7 — Integration & QA

* End-to-end testing.
* Concurrent transaction testing.
* Permission testing.
* Docker testing.
* Database persistence testing.
* Responsive testing.
* Fix bugs.

Phase 8 — Documentation

* README.
* Installation guide.
* Development guide.
* Production deployment guide.
* API documentation.
* Backup/restore guide.
* Troubleshooting guide.

⸻

25. QUY TẮC LÀM VIỆC CHO AI CODING AGENT

1. Kiểm tra repository trước khi tạo file.
2. Đọc skill ui-ux-pro-max trước khi thiết kế UI.
3. Không tự ý thay đổi tech stack.
4. Không tạo mock API thay cho backend thật.
5. Không hardcode dữ liệu nghiệp vụ.
6. Không bỏ qua validation.
7. Không bỏ qua authorization.
8. Không cho cập nhật tồn kho trực tiếp ngoài inventory service.
9. Không cho xuất kho âm.
10. Không ghi nhận chứng từ hai lần.
11. Không xóa cứng dữ liệu đã phát sinh giao dịch.
12. Không tạo nút không hoạt động mà không ghi rõ.
13. Không tạo Dockerfile mang tính minh họa mà không kiểm tra build.
14. Không sử dụng SQLite thay PostgreSQL.
15. Không dùng Float cho tiền.
16. Không hardcode secrets.
17. Sau mỗi phase, chạy kiểm tra phù hợp.
18. Khi phát hiện lỗi, sửa nguyên nhân gốc.
19. Không bỏ qua lỗi TypeScript, Python hoặc database migrations.
20. Không tuyên bố hoàn thành khi chưa kiểm thử.
21. Ưu tiên tính đúng đắn nghiệp vụ trước tính năng phụ.
22. Không thay đổi dữ liệu production khi chưa có xác nhận.
23. Ghi rõ các giới hạn và phần chưa hoàn thiện.
24. Code phải sạch, dễ bảo trì, có cấu trúc rõ ràng.
25. Nếu môi trường hỗ trợ, hãy trực tiếp tạo file, chạy lệnh, kiểm thử và sửa lỗi thay vì chỉ cung cấp hướng dẫn.

⸻

26. TIÊU CHÍ HOÀN THÀNH

Dự án chỉ được coi là hoàn thành khi:

* Có đầy đủ source code frontend và backend.
* Frontend sử dụng React + TypeScript.
* Backend sử dụng Python FastAPI.
* Database sử dụng PostgreSQL.
* Giao diện áp dụng ui-ux-pro-max nếu skill khả dụng.
* Các module chính hoạt động với API thật.
* Authentication và RBAC hoạt động.
* Nhập kho cập nhật tồn kho chính xác.
* Xuất kho không gây âm kho.
* Chuyển kho không làm nhân đôi hàng.
* Kiểm kê điều chỉnh tồn kho an toàn.
* Báo cáo sử dụng dữ liệu thật.
* Alembic migrations hoạt động.
* Docker Compose build và khởi động thành công.
* Database giữ dữ liệu sau khi restart/rebuild.
* Có hướng dẫn backup/restore.
* Có README và .env.example.
* Các bài kiểm thử quan trọng đã chạy thành công.

Nếu chưa đáp ứng tiêu chí nào, phải ghi rõ tiêu chí đó chưa hoàn thành.

⸻

27. BẮT ĐẦU THỰC HIỆN NGAY

Hãy bắt đầu xây dựng dự án ngay trong workspace hiện tại.

Thứ tự thực hiện:

1. Kiểm tra môi trường và repository.
2. Kiểm tra, đọc và áp dụng skill ui-ux-pro-max.
3. Phân tích kiến trúc hệ thống.
4. Thiết kế PostgreSQL ERD.
5. Thiết kế API và inventory transaction engine.
6. Tạo cấu trúc dự án full-stack.
7. Tạo Docker Compose foundation.
8. Triển khai backend FastAPI và migrations.
9. Triển khai các nghiệp vụ quản lý kho.
10. Triển khai frontend với giao diện Enterprise SaaS.
11. Kết nối API thật.
12. Viết và chạy tests.
13. Build Docker images.
14. Khởi động toàn bộ hệ thống.
15. Kiểm tra các chức năng end-to-end.
16. Hoàn thiện tài liệu triển khai.

Sau mỗi phase, báo cáo ngắn gọn:

* Đã hoàn thành những gì.
* Các file đã tạo hoặc sửa.
* Các bài kiểm tra đã chạy và kết quả.
* Những vấn đề còn tồn tại.
* Phase tiếp theo.

Không dừng ở việc lập kế hoạch. Hãy tiến hành tạo source code thực tế theo từng phase.

MỤC TIÊU CUỐI CÙNG: Một website quản lý xuất nhập tồn kho hiện đại, đẹp, chính xác, bảo mật, sử dụng FastAPI + React + PostgreSQL và được đóng gói hoàn chỉnh bằng Docker Compose, sẵn sàng triển khai lên VPS.