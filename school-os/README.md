# Sunbot School OS V3

Ứng dụng điều hành phát triển trường Sunbot, giao diện tiếng Việt và tối ưu để staff không phải hiểu độ phức tạp phía sau.

## Staff nhìn thấy

- Hôm nay
- Trường học
- Việc cần làm
- Cơ hội

## Quản lý nhìn thêm

- Hiệu suất bán hàng
- Dự báo & gia hạn
- Kết nối dữ liệu / cấu hình triển khai

## Kiến trúc V3

- `v3.html`: UI nghiệp vụ ổn định.
- `state-bridge.js`: bridge state của UI cho các runtime module.
- `app-config.js`: cấu hình triển khai không chứa bí mật.
- `backend-adapter.js`: transport/session/API client.
- `runtime-patch.js`: email + tracked link + activity integration.
- `multiuser-runtime.js`: login, role UI, load dữ liệu, record-level persistence.
- Apps Script backend: auth, Gmail, tracked link, event store, record APIs.

## Multi-user

Backend dùng record-level mutation cho:

- School
- Contact
- Task
- Opportunity

Mỗi record có `record_version`. Khi client sửa bản cũ, backend trả `RECORD_VERSION_CONFLICT` và frontend tải lại dữ liệu thay vì ghi đè.

## Authentication

- Login bằng email + mật khẩu.
- Password lưu hash + salt, không lưu rõ.
- Session 12 giờ, token backend chỉ lưu dạng hash.
- Role: SUPER_ADMIN, ADMIN, LEADER, STAFF.

## Email & tracking

- Email gửi qua Gmail backend.
- Tài liệu có unique tracked link.
- Mở tài liệu tạo `LINK_OPENED` và hot signal trong activity feed.
- Không dùng tracking pixel như tín hiệu chính.

## Ranh giới sản phẩm

School OS quản lý quan hệ trường, stakeholder, task, opportunity, proposal/decision, renewal và handover.

Không quản lý chi tiết lớp học, học sinh, attendance, assessment hay robot inventory vận hành. Các hệ khác liên kết bằng `school_id`.

## Production status

Code foundation đã có, nhưng chưa deploy backend thật từ repo. Trước khi merge production phải test end-to-end: health, login, role, conflict, Gmail, tracked link và cross-origin trên đúng domain/browser staff dùng.
