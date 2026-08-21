# Sunbot School OS – Hướng dẫn bật backend thật

## 1. Trạng thái hiện tại

School OS V3 có 2 chế độ:

- `Backend: Demo`: không gửi email thật; dữ liệu nghiệp vụ demo vẫn lưu trên trình duyệt.
- `Backend: Đã kết nối`: email, tracked link và activity/event dùng Apps Script backend.

Staff không cần cấu hình backend. Phần kết nối chỉ hiện trong `Chế độ quản lý`.

## 2. Backend hiện có

File Apps Script:

`apps-script/school_os_sales_services_v01.gs`

Service hỗ trợ:

1. `send_email`
2. `create_tracked_link`
3. `log_activity`
4. `get_activity`
5. `health`

Các sheet được tạo tự động:

- `SO_ACTIVITIES`
- `SO_TRACKED_LINKS`
- `SO_EMAIL_LOG`

## 3. Khởi tạo

1. Tạo một Apps Script project riêng cho School OS.
2. Copy nội dung `school_os_sales_services_v01.gs` vào project.
3. Chạy hàm `schoolOsSetup()` một lần bằng tài khoản Google được phép gửi email Sunbot.
4. Cấp quyền Google theo yêu cầu.
5. Hàm setup sẽ:
   - tạo spreadsheet `SUNBOT_SCHOOL_OS_DATA` nếu chưa có;
   - tạo 3 bảng dữ liệu;
   - tạo API key trong Script Properties.
6. Lưu lại:
   - Spreadsheet URL;
   - API key.

Không commit API key vào GitHub.

## 4. Deploy Web App

Deploy Apps Script dưới dạng Web App.

Khuyến nghị giai đoạn nội bộ:

- Execute as: tài khoản vận hành Sunbot.
- Access: phạm vi phù hợp với cách frontend gọi service.

Sau deploy, lấy URL dạng:

`https://script.google.com/macros/s/.../exec`

## 5. Kết nối từ School OS

1. Mở School OS.
2. Chuyển `Chế độ quản lý`.
3. Bấm `Backend: Demo`.
4. Nhập:
   - Web App URL;
   - API key;
   - Link gốc Profile Sunbot;
   - Link gốc Proposal;
   - Link gốc Báo giá.
5. Bấm `Kiểm tra kết nối`.
6. Chỉ khi app báo `Kết nối backend thành công` mới bật gửi email thật.

## 6. Kiểm thử bắt buộc trước khi dùng thật

### Test A – Health

App phải đọc được phản hồi `status=ok`.

### Test B – Email nội bộ

Gửi một email thử tới địa chỉ nội bộ, không gửi khách hàng ngay.

Xác minh:

- email đến đúng người;
- subject/body đúng;
- `SO_EMAIL_LOG` có bản ghi;
- `SO_ACTIVITIES` có `EMAIL_SENT`.

### Test C – Tracked link

Gửi email nội bộ có một link tài liệu.

Bấm link và xác minh:

- chuyển đúng tài liệu gốc;
- `SO_TRACKED_LINKS.open_count` tăng;
- có `first_open_at`, `last_open_at`;
- `SO_ACTIVITIES` xuất hiện `LINK_OPENED`;
- mở lại School OS và bấm `Đồng bộ dấu vết`, event xuất hiện trong timeline trường.

### Test D – Cross-origin

Apps Script Content Service trả nội dung qua URL chuyển hướng `script.googleusercontent.com`. Trước khi production phải kiểm tra browser thực tế của staff có gọi API và đọc được phản hồi sau redirect hay không.

Nếu trình duyệt/domain chặn cross-origin:

- không dùng `no-cors` cho email vì app sẽ không biết gửi thành công hay thất bại;
- chuyển transport sang một proxy/backend cùng origin hoặc phục vụ frontend qua Apps Script HTML Service;
- giữ nguyên UI và API contract hiện tại.

## 7. Quy tắc an toàn

- Không dùng tracking pixel để suy diễn chắc chắn rằng email đã đọc.
- Ưu tiên tracked document link vì tín hiệu hành vi rõ hơn.
- Không lưu dữ liệu cá nhân không cần thiết.
- Không cho staff nhìn API key.
- Không hard-code API key trong repo public.
- Mọi email gửi thật phải tạo activity log.
- Không hiển thị `Đã gửi` nếu backend trả lỗi.
- Không xóa activity; nếu cần điều chỉnh thì dùng audit/correction event.

## 8. Việc tiếp theo

Sau khi 3 service trên chạy ổn định, chuyển dần core data khỏi `localStorage` theo thứ tự:

1. Schools
2. Contacts
3. Tasks
4. Opportunities
5. Documents
6. Renewals / Handover

Frontend V3 không cần thiết kế lại; chỉ thay data adapter.
