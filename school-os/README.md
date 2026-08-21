# Sunbot School OS V3

Hệ điều hành phát triển trường dành cho Sunbot, thiết kế theo nguyên tắc: staff chỉ nhìn thấy phần việc cần làm; độ phức tạp nằm phía sau hệ thống.

## Giao diện staff

Staff chỉ dùng 4 khu vực chính:

1. Hôm nay
2. Trường học
3. Việc cần làm
4. Cơ hội

Các lớp sâu như stakeholder, email, tracked document, qualification, renewal và handoff chỉ hiện trong đúng ngữ cảnh của hồ sơ trường.

## Giao diện quản lý

Quản lý có thêm:

- Hiệu suất bán hàng
- Dự báo & gia hạn
- Kết nối backend

## Luồng nghiệp vụ lõi

Trường -> Người liên hệ -> Giao tiếp -> Bước tiếp theo -> Công việc -> Cơ hội -> Đề xuất -> Quyết định -> Bàn giao / Gia hạn.

## Backend runtime

Entry point `school-os/index.html` mở `v3-runtime.html`.

Runtime load:

- `v3.html`: UI/UX V3 ổn định
- `backend-adapter.js`: API adapter
- `runtime-patch.js`: nối UI V3 với backend mà không sửa trực tiếp khối UI lớn

Apps Script backend:

`apps-script/school_os_sales_services_v01.gs`

Hỗ trợ:

- gửi Gmail;
- tạo tracked document link;
- ghi nhận link được mở;
- unified activity/event log;
- đồng bộ event về timeline của trường.

## Chế độ an toàn

Nếu backend chưa cấu hình, app hiển thị `Backend: Demo` và không gửi email thật.

Nếu backend được kết nối và kiểm tra thành công, cùng nút `Gửi email` sẽ gọi Apps Script và chỉ báo đã gửi khi backend trả thành công.

Xem `BACKEND_SETUP.md` để triển khai.

## Tiếp theo

Core data hiện vẫn chủ yếu chạy bằng localStorage. Bước tiếp theo là chuyển dần Schools, Contacts, Tasks, Opportunities, Documents và Renewals sang backend chuẩn hóa nhưng giữ nguyên UI V3.
