# Sunbot School OS v0.4 – Production deployment

## Mục tiêu
Deploy source v0.4 của Apps Script Web App cho School OS Production. Database đã migrate sang USRxxxx/username/team hierarchy; frontend có deploy guard và chỉ mở governance khi health.version >= 0.4.

## Files phải có trong Apps Script project
- school_os_sales_services_v01.gs
- school_os_auth_v01.gs
- school_os_record_api_v01.gs
- school_os_governance_v04.gs
- các file backend hiện hành còn lại của School OS (core data/helpers) giữ nguyên

## Sau khi cập nhật code
1. Chạy `schoolOsSetup()` một lần từ Apps Script editor để ensure schema/columns.
2. Deploy > Manage deployments > Edit deployment hiện tại > chọn **New version** > Deploy.
3. Giữ Web App chạy với cùng execution/access settings như deployment đang dùng, để URL production không đổi.
4. Mở endpoint health bằng POST `{"action":"health"}`; kết quả phải có `version: "0.4"`.
5. Mở School OS và tải lại. Deploy guard sẽ tự mở `Đề xuất trường`, `Cần duyệt`, `Người dùng` khi backend báo v0.4.

## Activation role
Database production hiện cố ý giữ Nhung/Dung/Thu là STAFF cho tới khi backend v0.4 được deploy, tránh lỗ hổng quyền ở backend cũ. Sau khi health xác nhận 0.4, đổi:
- USR0002 Hoàng Nhung -> LEADER
- USR0003 Lê Thị Dung -> LEADER
- USR0004 Minh Thu -> LEADER
Sau đó revoke toàn bộ session để mọi người đăng nhập lại.

## Smoke test bắt buộc
- Admin `van`: thấy tất cả, theo team; có Cần duyệt + Người dùng.
- Nhung: chỉ TEAM001, gồm staff261-263.
- Dung: chỉ TEAM002, gồm staff264-266.
- Thu: chỉ TEAM003, gồm staff267-269.
- Staff261: chỉ dữ liệu owner_user_id=USR0005.
- Staff không thể tạo trường chính thức; chỉ submit proposal.
- Leader không thể giao task cho staff ngoài team.
- Admin duyệt proposal phải chọn Leader, sau đó mới sinh SO_SCHOOLS row.
- LINK_OPENED có thể tăng trạng thái quan tâm nhưng không tự sinh opportunity.
- TASK done không tự đẩy trạng thái trường.

## Rollback
Nếu smoke test lỗi, giữ các role leader ở STAFF và sửa deployment trước; frontend guard sẽ khóa governance nếu backend health < 0.4.