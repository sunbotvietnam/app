# Sunbot School OS – Deploy production ngay

## Trạng thái đã chuẩn bị

- Database production thật: `SUNBOT_SCHOOL_OS_PRODUCTION`
- Spreadsheet ID: `1EB-nbVGV38tfYRRla2t_9FmGP51UZo7dbkC_sOSXb-A`
- Không có seed/demo data.
- Đã có tài khoản SUPER_ADMIN đầu tiên trong `SO_USERS`.
- Bootstrap production: `apps-script/school_os_production_bootstrap.gs`.

## Bước duy nhất cần làm trên Google Apps Script

1. Tạo một Apps Script project mới tên `Sunbot School OS Production`.
2. Tạo 5 file `.gs` và dán nội dung tương ứng từ branch `feat/sunbot-school-os-v2`:
   - `school_os_sales_services_v01.gs`
   - `school_os_auth_v01.gs`
   - `school_os_record_api_v01.gs`
   - `school_os_core_data_v01.gs`
   - `school_os_production_bootstrap.gs`
3. Chạy `schoolOsProductionBootstrap()` một lần và cấp quyền Google.
4. Deploy > New deployment > Web app.
5. Execute as: Me.
6. Access: Anyone with the link (app tự xác thực bằng session; API key chỉ dùng bootstrap/quản trị).
7. Copy Web App URL dạng `https://script.google.com/macros/s/.../exec`.

## Sau khi có Web App URL

- Ghi URL vào `school-os/app-config.js`.
- Test `health`.
- Test login SUPER_ADMIN.
- Test tạo/sửa trường.
- Test conflict hai thiết bị.
- Test Gmail nội bộ.
- Test tracked link.
- Khi tất cả pass mới merge PR và đưa frontend production.

## Không làm

- Không import dữ liệu demo.
- Không chia sẻ Google Sheet cho staff; staff chỉ dùng app.
- Không đưa API key vào frontend hoặc GitHub.
- Không merge PR trước khi Web App pass end-to-end.
