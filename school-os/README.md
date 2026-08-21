# Sunbot School OS V3

## Nguyên tắc UX

Staff không nhìn thấy toàn bộ độ phức tạp của hệ thống. Giao diện dùng progressive disclosure theo vai trò và ngữ cảnh.

### Chế độ nhân viên

Chỉ có 4 màn hình chính:

1. Hôm nay
2. Trường học
3. Việc cần làm
4. Cơ hội

Email, người liên hệ, tracking tài liệu, qualification và gia hạn nằm bên trong hồ sơ trường khi cần, không tạo thêm menu riêng.

### Chế độ quản lý

Bổ sung:

1. Hiệu suất bán hàng
2. Dự báo & gia hạn

## Các lớp nghiệp vụ đã mô phỏng trong V3

- School Intelligence: loại trường, quy mô, STEAM hiện tại, cơ chế địa phương, nguồn cơ hội.
- Stakeholder CRM: người liên hệ, vai trò quyết định, thái độ.
- Engagement Hub: email template, tracked document, activity timeline, tín hiệu nóng.
- Sales Execution: task, next action, risk.
- Opportunity Qualification: Fit, Need, Authority, Funding, Timing, Regulation, Capacity.
- Sales Performance: effort, discipline, quality, pipeline outcome.
- Revenue Lifecycle: forecast, renewal, handoff checklist.
- CEO Next Best Action: ưu tiên follow-up theo tín hiệu và rủi ro.

## Production backend

V3 vẫn dùng localStorage cho demo. Khi production, UI giữ nguyên và thay data layer bằng Apps Script API / Google Sheets. Email và tracked links cần backend thật để gửi mail, tạo token link và ghi open/click events.
