# Sunbot School OS V3 – Kiến trúc sản phẩm

## 1. Nguyên tắc UX

Không biến mỗi năng lực hệ thống thành một menu.

### Staff nhìn thấy

- Hôm nay
- Trường học
- Việc cần làm
- Cơ hội

### Quản lý nhìn thêm

- Hiệu suất bán hàng
- Dự báo & gia hạn
- Cấu hình backend

## 2. 8 lớp logic phía sau

1. School Intelligence
2. Stakeholder CRM
3. Engagement Hub
4. Sales Execution
5. Opportunity Engine
6. Revenue Lifecycle
7. Sales Performance
8. CEO Intelligence

Các lớp này là kiến trúc dữ liệu/logic, không phải 8 menu.

## 3. Ranh giới hệ thống

School OS chịu trách nhiệm đến:

- quan hệ trường;
- contact/stakeholder;
- email, call, meeting, document engagement;
- task/next action;
- opportunity;
- proposal/decision;
- renewal;
- handover checklist.

School OS không quản lý chi tiết:

- lớp học;
- học sinh;
- buổi học;
- attendance;
- assessment;
- robot inventory vận hành.

Các hệ vận hành liên kết bằng `school_id`.

## 4. Runtime architecture

```text
index.html
  -> v3-runtime.html
      -> v3.html (UI ổn định)
      -> backend-adapter.js
      -> runtime-patch.js
          -> Apps Script Web App
              -> Gmail
              -> Google Sheets event store
              -> tracked-link redirect
```

Ưu điểm:

- UI không phải sửa mỗi lần backend đổi;
- có thể rollback backend integration;
- demo mode vẫn dùng được;
- production transport có thể đổi mà không đổi workflow staff.

## 5. Event model tối thiểu

Các event quan trọng:

- EMAIL_SENT
- LINK_CREATED
- LINK_OPENED
- MANUAL_ACTIVITY

Sau này mở rộng:

- EMAIL_REPLY
- MEETING_BOOKED
- MEETING_COMPLETED
- PROPOSAL_SENT
- PROPOSAL_VIEWED
- STAGE_CHANGED
- OPPORTUNITY_WON
- OPPORTUNITY_LOST
- RENEWAL_DUE
- HANDOVER_COMPLETED

## 6. Nguyên tắc đánh giá sales

Không dùng một điểm tổng duy nhất.

Luôn tách:

- Nỗ lực
- Kỷ luật
- Chất lượng
- Kết quả

Không khuyến khích KPI tạo hành vi gọi/gửi email cho đủ số lượng.

## 7. Nguyên tắc tracking

- Không suy diễn email mở = khách hàng quan tâm.
- Tracked document open là signal, không phải quyết định mua.
- Repeated views + reply + meeting mới tạo engagement mạnh.
- Mọi signal phải gắn school_id và nếu có thì contact_id/opportunity_id.
