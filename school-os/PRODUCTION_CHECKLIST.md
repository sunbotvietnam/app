# Sunbot School OS – Production Checklist

## Trước khi deploy

- [ ] Apps Script có đủ 4 module backend.
- [ ] Chạy `schoolOsSetup()` thành công.
- [ ] Tạo user thật bằng `schoolOsCreateOrResetUser()`.
- [ ] Không có password/API key trong repo.
- [ ] `app-config.js` có Web App URL production.
- [ ] Seed/demo data không được tự động import.

## Kiểm thử xác thực

- [ ] Login đúng.
- [ ] Login sai bị từ chối.
- [ ] STAFF không thấy dashboard quản lý.
- [ ] LEADER/ADMIN thấy dashboard quản lý.
- [ ] Logout thu hồi session phía client.
- [ ] Reset password làm session cũ mất hiệu lực.

## Kiểm thử dữ liệu nhiều người dùng

- [ ] Tạo trường từ thiết bị A, thiết bị B đọc được.
- [ ] Tạo task/opportunity từ A, B đọc được.
- [ ] Hai thiết bị sửa cùng record tạo `RECORD_VERSION_CONFLICT`.
- [ ] Client không ghi đè bản mới hơn.
- [ ] Soft delete không xóa vật lý dữ liệu.
- [ ] `updated_by`, `updated_at`, `record_version` được cập nhật.

## Kiểm thử giao tiếp

- [ ] Gửi email nội bộ thành công.
- [ ] Email lỗi không hiển thị “đã gửi”.
- [ ] Email log được ghi.
- [ ] Tracked link redirect đúng.
- [ ] Open count tăng đúng.
- [ ] Activity feed nhận `LINK_OPENED`.

## Kiểm thử UX staff

- [ ] Chỉ còn ngôn ngữ nghiệp vụ, không hiện từ kỹ thuật không cần thiết.
- [ ] Staff dùng được 4 màn hình chính mà không cần hướng dẫn kỹ thuật.
- [ ] Tạo trường/task/cơ hội không quá nhiều bước.
- [ ] Có next action rõ ràng sau tương tác.
- [ ] Mobile dùng được với thao tác cơ bản.

## Pilot

Pilot nội bộ trước khi mở rộng. Không merge vào production chỉ vì UI đã đẹp; chỉ merge sau khi auth, record conflict, Gmail, tracked link và cross-origin đều pass end-to-end.
