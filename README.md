# Hệ Thống Quản Lý Kho Doanh Nghiệp (Enterprise WMS)

Một hệ thống Quản lý Kho Hàng & Chuỗi Cung ứng quy mô doanh nghiệp hoàn chỉnh, chịu tải cao, thiết kế chuẩn kiến trúc Microservices/Monolith sẵn sàng đóng gói Docker Compose và tuân thủ các nguyên tắc kế toán kho chuẩn mực.

---

## 🌟 Tính Năng Nổi Bật

1. **Kiểm Soát Tồn Kho Chặt Chẽ (Zero Negative Stock)**:
   - Sử dụng cơ chế khóa hàng ở tầng cơ sở dữ liệu (`SELECT FOR UPDATE`) trong mọi giao dịch xuất/chuyển kho.
   - Tuyệt đối ngăn chặn tồn kho âm trong điều kiện tải đồng thời (race condition).
2. **Sổ Nhật Ký Tồn Kho Bất Biến (Immutable Transaction Journal)**:
   - Mỗi biến động nhập, xuất, chuyển, kiểm kê đều tự động sinh bản ghi nhật ký kiểm toán không thể xóa/sửa (`inventory_transactions`).
3. **Tính Giá Vốn Tự Động (Weighted Average Cost)**:
   - Tự động tái tính toán giá vốn bình quân gia quyền liên hoàn ngay khi hoàn tất phiếu nhập kho.
4. **Phân Quyền Vai Trò Chuẩn Doanh Nghiệp (RBAC)**:
   - Super Admin, Quản lý kho (Warehouse Manager), Nhân viên kho (Staff), Mua hàng (Purchasing), Bán hàng (Sales), Kiểm toán viên (Auditor).
   - Bảo mật mật khẩu Argon2, JWT Access Token (60 phút) & Refresh Token (7 ngày) xoay vòng tự động.
5. **Dashboard & Phân Tích Thông Minh (10 KPIs & Charts)**:
   - Tổng giá trị kho, số lượng sản phẩm, cảnh báo hàng sắp hết / hết hàng, biểu đồ xu hướng xuất nhập, Top 5 sản phẩm luân chuyển nhanh nhất, báo cáo giá trị theo từng chi nhánh kho.
6. **Xuất Báo Cáo Excel**:
   - Tải về danh sách sản phẩm và báo cáo Xuất-Nhập-Tồn định dạng file Microsoft Excel (`.xlsx`) chỉ với 1 click.

---

## 🏗️ Công Nghệ Sử Dụng (Tech Stack)

### Backend
- **Ngôn ngữ**: Python 3.12+
- **Framework**: FastAPI (Asynchronous Web Framework)
- **Cơ sở dữ liệu**: PostgreSQL 17 + asyncpg
- **ORM & Migrations**: SQLAlchemy 2.0 (Async/Await) + Alembic
- **Caching**: Redis 7 (In-memory Cache & Sessions)
- **Bảo mật**: JWT (HS256) + Argon2id Password Hashing + Pydantic v2
- **Kiểm thử**: Pytest + Pytest-Asyncio (100% passed)

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Thiết kế chuẩn UI/UX Pro Max Enterprise SaaS Dashboard)
- **State Management**: TanStack Query v5 (Server state caching) + Zustand (Client auth & UI state)
- **Biểu đồ**: Recharts
- **Icons & UI**: Lucide React + Tailwind Merge

### DevOps & Packaging
- **Container**: Docker Multi-stage Builds + Docker Compose v2
- **Reverse Proxy**: Nginx Alpine (Gzip, Cache-Control, Security Headers, SPA Fallback)
- **Scripts**: Backup (`backup-db.sh`), Restore (`restore-db.sh`), Seed (`init-db.sh`), Health-check (`health-check.sh`)

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Tiên Quyết
- Docker Engine & Docker Compose (v2.20+)
- Git (tùy chọn)

### 1. Khởi chạy toàn bộ hệ thống bằng Docker Compose (Khuyên dùng)

Chỉ cần một câu lệnh duy nhất:

```bash
docker compose up -d --build
```

Hệ thống sẽ tự động:
1. Khởi tạo cơ sở dữ liệu **PostgreSQL 17** và bộ đệm **Redis 7**.
2. Chạy migration schema cơ sở dữ liệu qua **Alembic**.
3. Tự động seed dữ liệu mẫu: Danh mục, đơn vị tính, nhà kho, nhà cung cấp, khách hàng, sản phẩm và tài khoản quản trị.
4. Khởi động **FastAPI Backend** tại cổng `8000`.
5. Đóng gói và phục vụ **React Frontend SPA** qua Nginx tại cổng `80`.

### 2. Thông Tin Đăng Nhập Mặc Định

Sau khi khởi chạy, truy cập trình duyệt web tại địa chỉ: `http://localhost`

- **Tài khoản**: `admin@stockmanager.local`
- **Mật khẩu**: `Admin@123456`
- **Vai trò**: `SUPER_ADMIN` (Toàn quyền quản trị)

---

## 📖 Tài Liệu API Backend (Interactive API Docs)

FastAPI tự động sinh tài liệu API tương tác:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛠️ Quản Trị & Sao Lưu Cơ Sở Dữ Liệu (Backup & Restore)

Các kịch bản quản trị nằm trong thư mục `scripts/`:

### 1. Sao lưu tự động cơ sở dữ liệu (PostgreSQL dump gzip)
```bash
bash scripts/backup-db.sh
```
*File nén sao lưu sẽ được lưu trữ trong thư mục `./backups/` theo định dạng `stockmanager_backup_YYYYMMDD_HHMMSS.sql.gz` với chính sách tự động xóa sau 30 ngày.*

### 2. Phục hồi cơ sở dữ liệu từ file sao lưu
```bash
bash scripts/restore-db.sh ./backups/stockmanager_backup_YYYYMMDD_HHMMSS.sql.gz
```

### 3. Khởi tạo lại dữ liệu mẫu
```bash
bash scripts/init-db.sh
```

### 4. Kiểm tra sức khỏe toàn hệ thống
```bash
bash scripts/health-check.sh
```

---

## 🧪 Chạy Kiểm Thử Tự Động (Unit & Integration Tests)

Chạy bộ kiểm thử backend với Pytest:

```bash
# Windows PowerShell
$env:PYTHONPATH="backend"
python -m pytest backend/tests -v

# Linux / macOS
PYTHONPATH=backend pytest backend/tests -v
```

Kết quả kiểm thử:
- `test_login_success`: Đăng nhập cấp JWT thành công
- `test_login_wrong_password`: Chặn sai mật khẩu
- `test_superuser_seed_exists`: Đảm bảo tài khoản super admin được kích hoạt
- `test_inbound_increases_stock_and_creates_transaction`: Nhập kho tăng tồn và ghi nhật ký kiểm toán
- `test_outbound_decreases_stock`: Xuất kho trừ tồn chính xác
- `test_outbound_exceeds_stock_raises_negative_stock_error`: Chặn xuất vượt tồn thực tế (Zero Negative Stock)
- `test_row_lock_race_condition`: Đảm bảo an toàn đa luồng giao dịch đồng thời

---

## 📁 Cấu Trúc Dự Án

```
├── backend/
│   ├── alembic/                # Quản lý phiên bản migration cơ sở dữ liệu
│   ├── app/
│   │   ├── api/v1/             # 12+ API Routers (Auth, Master Data, Inbound, Outbound, Transfer, Reports,...)
│   │   ├── core/               # Cấu hình hệ thống, Database async engine, JWT, Security, Logging
│   │   ├── dependencies/       # Fastapi Dependencies, RBAC permissions guard, Audit Logger
│   │   ├── models/             # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/            # Pydantic v2 Validation schemas
│   │   ├── services/           # Nghiệp vụ lõi tồn kho: SELECT FOR UPDATE, WAC calculation
│   │   ├── utils/              # Data Seeder khởi tạo dữ liệu mẫu
│   │   └── main.py             # FastAPI App Lifespan, CORS, Middleware
│   ├── tests/                  # Bộ kiểm thử Pytest Async
│   ├── Dockerfile              # Python 3.12 Slim Multi-stage Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Button, Badge, Modal, Input, Select, Skeleton, AppLayout, Toast
│   │   ├── features/           # 27 trang giao diện chức năng (Dashboard, Products, Receipts, Issues, Reports,...)
│   │   ├── services/           # Axios HTTP Client với tự động refresh JWT token khi hết hạn
│   │   ├── stores/             # Zustand stores (AuthStore, UIStore)
│   │   ├── types/              # TypeScript interface định kiểu dữ liệu
│   │   ├── utils/              # Formatters tiền tệ VND, ngày tháng DD/MM/YYYY
│   │   ├── App.tsx             # Định tuyến React Router v6
│   │   └── main.tsx
│   ├── nginx.conf              # Cấu hình Nginx Alpine serving SPA & reverse proxy /api/
│   ├── Dockerfile              # Node builder + Nginx Alpine multi-stage build
│   └── package.json
├── scripts/                    # Các shell script sao lưu, phục hồi, kiểm tra sức khỏe
├── docker-compose.yml          # Triển khai Production hoàn chỉnh
├── docker-compose.dev.yml      # Triển khai Môi trường Phát triển (Hot-reloading)
├── .env.example                # File mẫu các biến môi trường
└── README.md
```

---

## 🔒 Bản Quyền & Giấy Phép
Dự án được xây dựng theo chuẩn Kiến trúc Doanh nghiệp, sẵn sàng triển khai trong môi trường thực tế (Production-Ready).

