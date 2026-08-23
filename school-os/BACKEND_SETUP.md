# Sunbot School OS – Triển khai backend và multi-user

## 1. Mục tiêu production

Staff chỉ cần:

1. Mở School OS.
2. Đăng nhập bằng email + mật khẩu.
3. Làm việc trong 4 khu vực: Hôm nay, Trường học, Việc cần làm, Cơ hội.

Staff không nhập Web App URL, không nhìn API key và không thao tác cấu hình kỹ thuật.

## 2. Thành phần backend

Apps Script project cần các file:

- `school_os_sales_services_v01.gs` – router Web App, Gmail, tracked link, activity.
- `school_os_core_data_v01.gs` – snapshot/migration cũ, chỉ dùng khi cần.
- `school_os_auth_v01.gs` – user, password hash, session, role.
- `school_os_record_api_v01.gs` – API theo từng record, version conflict, soft delete.

Các sheet chính:

- `SO_SCHOOLS`
- `SO_CONTACTS`
- `SO_TASKS`
- `SO_OPPORTUNITIES`
- `SO_ACTIVITIES`
- `SO_TRACKED_LINKS`
- `SO_EMAIL_LOG`
- `SO_USERS`
- `SO_SESSIONS`
- `SO_META`

## 3. Khởi tạo backend

1. Tạo Apps Script project riêng cho School OS.
2. Copy 4 file backend vào project.
3. Chạy `schoolOsSetup()` một lần bằng tài khoản Google vận hành Sunbot.
4. Cấp quyền Sheets/Gmail theo yêu cầu.
5. Lưu Spreadsheet URL và API key ở nơi quản trị an toàn.
6. Không commit API key vào GitHub.

`schoolOsSetup()` tạo/kiểm tra toàn bộ sheet và bổ sung các cột `record_version`, `updated_by`, `deleted_at` cho dữ liệu multi-user.

## 4. Tạo tài khoản người dùng

Không tạo mật khẩu mặc định trong source code.

Từ Apps Script editor, quản trị viên chạy trực tiếp:

```javascript
schoolOsCreateOrResetUser(
  'email-thuc-te@domain.vn',
  'Tên nhân sự',
  'STAFF',
  'Hà Nội',
  'mat-khau-khoi-tao-an-toan'
)
```

Role hỗ trợ:

- `SUPER_ADMIN`
- `ADMIN`
- `LEADER`
- `STAFF`

Mật khẩu không lưu dạng rõ. Backend lưu SHA-256 hash + salt riêng cho từng user.

Khi reset mật khẩu, mọi session cũ của user bị thu hồi.

## 5. Phân quyền

### STAFF

- Chỉ dùng giao diện staff.
- Truy cập trường thuộc phạm vi owner/khu vực được phân.
- Tạo/sửa task, opportunity, activity trong phạm vi được phép.
- Không truy cập dashboard quản trị.

### LEADER

- Có giao diện quản lý.
- Xem dữ liệu điều hành và hiệu suất theo phạm vi quản lý.

### ADMIN / SUPER_ADMIN

- Quản trị toàn hệ thống.
- Bootstrap/migration/configuration.

## 6. Deploy Web App

Deploy Apps Script dưới dạng Web App.

Khuyến nghị pilot nội bộ:

- Execute as: tài khoản vận hành Sunbot.
- Access: cấu hình phù hợp để frontend gọi Web App.

Lấy URL dạng:

`https://script.google.com/macros/s/.../exec`

## 7. Cấu hình frontend một lần

Sửa file:

`school-os/app-config.js`

```javascript
window.SCHOOL_OS_CONFIG = {
  environment: 'production',
  backendUrl: 'https://script.google.com/macros/s/.../exec',
  schoolYear: '2026–2027'
};
```

`backendUrl` không phải bí mật nên có thể nằm trong frontend.

Không đưa API key vào `app-config.js`.

Sau bước này staff không cần cấu hình URL trên thiết bị cá nhân.

## 8. Record-level API

Production dùng:

- `list_core_records`
- `upsert_school`
- `upsert_contact`
- `upsert_task`
- `upsert_opportunity`
- `delete_record`

Mỗi record có `record_version`.

Frontend gửi `expected_version` khi cập nhật. Nếu record đã được người khác sửa, backend trả:

`RECORD_VERSION_CONFLICT`

Frontend phải tải bản mới nhất thay vì âm thầm ghi đè.

`delete_record` là soft delete: dữ liệu được lưu trữ bằng `deleted_at`, không xóa vật lý ngay.

## 9. Session

- Login: email + password.
- Session mặc định: 12 giờ.
- Token thô chỉ lưu ở browser; backend chỉ lưu hash token.
- Logout hoặc reset password sẽ thu hồi session.
- Session hết hạn buộc đăng nhập lại.

## 10. Email và tracked link

Email thật chỉ chạy sau khi Web App deploy thành công.

Luồng:

`School OS -> Gmail -> Email Log -> Activity`

Tài liệu gửi qua tracked link:

`Email -> unique link -> mở tài liệu -> LINK_OPENED -> hot signal`

Không dùng email-open pixel làm tín hiệu chính.

## 11. Kiểm thử bắt buộc

### A. Health

Frontend đọc được `status=ok`.

### B. Login

- đúng mật khẩu đăng nhập thành công;
- sai mật khẩu bị từ chối;
- STAFF không mở được giao diện quản lý;
- session hết hạn yêu cầu login lại.

### C. Multi-user conflict

1. Hai thiết bị mở cùng một record.
2. Thiết bị A sửa và lưu.
3. Thiết bị B sửa bản cũ.
4. Backend phải trả `RECORD_VERSION_CONFLICT`.
5. B tải lại record mới, không ghi đè dữ liệu của A.

### D. Email nội bộ

Gửi tới email nội bộ trước khi gửi khách hàng.

Xác minh `SO_EMAIL_LOG` và `EMAIL_SENT`.

### E. Tracked link

Mở link nội bộ và xác minh:

- redirect đúng tài liệu;
- `open_count` tăng;
- `first_open_at`, `last_open_at` có dữ liệu;
- `LINK_OPENED` xuất hiện trong activity feed.

### F. Cross-origin

Test Web App từ đúng domain/browser staff sẽ dùng.

Không dùng `no-cors` để che lỗi gửi email.

## 12. Dữ liệu ban đầu

Không tự động đẩy seed/demo data vào production.

Dữ liệu production phải được làm sạch trước khi import:

- trường thật;
- contact thật;
- owner đúng;
- task còn hiệu lực;
- opportunity còn hiệu lực;
- renewal date nếu có.

Dùng stable `school_id`, không dùng tên trường làm khóa.

## 13. Pilot

Nên pilot nội bộ trước khi mở toàn đội.

Theo dõi:

- thao tác có nhanh không;
- staff có tiếp tục dùng Excel/Zalo song song để bù thiếu chức năng không;
- next action có được cập nhật đầy đủ không;
- conflict có phát sinh không;
- email/tracked link có ổn định không;
- KPI có tạo hành vi chạy số không.

Chỉ sau pilot mới chốt automation và cách chấm hiệu suất cuối cùng.
