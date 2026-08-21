# Sunbot School OS V2

Bản hoàn thiện frontend cho luồng theo dõi và phát triển trường Sunbot.

## Mục tiêu UX

Mở app là biết ngay: trường nào cần chú ý, ai phụ trách, bước tiếp theo là gì và hạn xử lý khi nào.

## Luồng nghiệp vụ lõi

Trường -> Tương tác -> Bước tiếp theo -> Công việc / Khám phá -> Cơ hội -> Đề xuất -> Quyết định.

## Các phần đã hoạt động trong frontend

- Dashboard Hôm nay với KPI tính từ dữ liệu hiện tại.
- Danh sách trường, tìm kiếm và bộ lọc.
- Hồ sơ trường dạng workspace với các tab Tổng quan, Tương tác, Công việc, Cơ hội, Tài liệu.
- Thêm trường mới.
- Tạo và hoàn thành công việc.
- Tạo cơ hội theo pipeline.
- Ghi nhận tương tác và tự cập nhật bước tiếp theo, hạn xử lý, mức độ rủi ro.
- Lưu trạng thái demo bằng localStorage.
- Mobile navigation và responsive layout.

## Chưa nối production backend

Bản này vẫn là frontend. Bước production tiếp theo là thay lớp localStorage bằng data adapter gọi Apps Script/Google Sheets theo schema V2, giữ nguyên UI và luồng nghiệp vụ.

Không nên đưa file nhị phân vào database; tài liệu nên lưu ở Drive và School OS chỉ giữ metadata, phiên bản, trạng thái và URL.