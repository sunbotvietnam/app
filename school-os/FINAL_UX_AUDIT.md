# Sunbot School OS – Final UX / Product Audit

## Tiêu chí

1. Tối giản: staff không phải học kiến trúc hệ thống.
2. Dễ hiểu: mỗi màn hình trả lời một câu hỏi nghiệp vụ rõ ràng.
3. Thông minh: ưu tiên ngoại lệ, next action, hot signal và renewal risk.
4. Chuyên nghiệp: không lộ thuật ngữ backend/runtime/demo trên giao diện thường.
5. Nhanh: giảm lớp runtime trùng, preload các lớp cần thiết, thao tác local phản hồi trước rồi đồng bộ record.

## Menu đã chốt

### Staff
- Hôm nay
- Trường học
- Việc cần làm
- Cơ hội

### Trong hồ sơ trường
- Tổng quan
- Người liên hệ
- Giao tiếp
- Công việc
- Cơ hội
- Gia hạn

### Quản lý
- Hiệu suất bán hàng
- Dự báo & gia hạn

Không bổ sung menu mới nếu chức năng có thể đặt đúng ngữ cảnh trong hồ sơ trường.

## Các thiếu sót phát hiện trong audit và đã sửa

### 1. Người liên hệ chỉ là placeholder
Đã bổ sung thêm/sửa contact thật và đồng bộ record-level API.

### 2. Không sửa được hồ sơ trường
Đã bổ sung Cập nhật hồ sơ ngay trong Tổng quan.

### 3. Công việc chỉ tạo/đánh dấu xong, không chỉnh sửa được
Đã bổ sung sửa nội dung, người phụ trách, hạn và mức độ.

### 4. Cơ hội không đổi được stage / giá trị / owner
Đã bổ sung modal cập nhật cơ hội; qualification vẫn chỉnh inline.

### 5. Trường mới dùng ngày cố định 24/08
Đã bỏ hard-code; form có Hạn bước tiếp theo và mặc định động.

### 6. Hạn task bị mất năm
Luồng tạo mới giữ ngày đầy đủ theo đầu vào và hiển thị theo định dạng Việt Nam.

### 7. Trang Hiệu suất hard-code Thu/Dung/Nhung
Đã chuyển sang tự nhận danh sách người đang sở hữu school/task/opportunity.

### 8. Gia hạn hiển thị mọi trường có renewal date
Đã chuyển thành cửa sổ 90 ngày, sắp theo mức độ gấp và nhận diện quá hạn.

### 9. Quản lý trên mobile không vào được màn hình quản trị
Đã thêm một nút Quản lý gọn trên mobile, mở 2 lựa chọn Hiệu suất và Dự báo & gia hạn.

### 10. runtime-patch trùng logic với V3
Phát hiện nguy cơ ghi activity hai lần. Đã bỏ runtime-patch khỏi production loader.

### 11. Thiếu hướng dẫn sử dụng trong app
Đã thêm Hướng dẫn nhanh theo role và một câu microcopy trong từng tab hồ sơ trường.

## Quy tắc UX bắt buộc

- Một trường đang theo dõi phải có Next Action + hạn xử lý.
- Giao tiếp = điều đã xảy ra + kết quả + bước tiếp theo.
- Công việc = hành động tương lai có owner + deadline.
- Chỉ tạo Cơ hội khi có tín hiệu thương mại thật.
- Qualification dựa trên bằng chứng, không dự đoán cảm tính.
- Gia hạn là một lifecycle riêng, không đợi tới cuối hợp đồng.
- Staff không nhìn thấy API key, backend, runtime, data version.
- Không biến mỗi capability thành một menu.

## Hiệu năng

Đã thực hiện:
- bỏ runtime integration trùng;
- preload các file runtime cần thiết;
- dùng cache revalidation thay vì `no-store` cho v3.html;
- thao tác edit phản hồi local ngay, backend sync theo record;
- chỉ tải activity trường sau khi mở hồ sơ, không chặn render đầu tiên.

Cần đo sau deploy thật:
- thời gian login → dashboard;
- thời gian load 300 / 500 / 1.000 trường;
- thời gian upsert record qua Apps Script;
- thời gian mở school drawer;
- Gmail send + tracked-link round trip.

Không tối ưu backend theo giả định trước khi có số đo production.

## Chưa coi là pass production nếu chưa test

- Auth/role trên tài khoản thật.
- Hai thiết bị cùng sửa một record.
- Gmail thật.
- Tracked link thật.
- Cross-origin thực tế.
- Mobile thật.
- Dữ liệu Sunbot thật sau khi làm sạch.

PR phải giữ draft cho tới khi các bài test trên pass.
