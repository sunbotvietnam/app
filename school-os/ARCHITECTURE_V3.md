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
- Cấu hình triển khai

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

School OS không quản lý chi tiết lớp học, học sinh, buổi học, attendance, assessment hay robot inventory vận hành. Các hệ vận hành liên kết bằng `school_id`.

## 4. Runtime architecture

```text
index.html
  -> v3-runtime.html
      -> v3.html
      -> state-bridge.js
      -> app-config.js
      -> backend-adapter.js
      -> runtime-patch.js
      -> multiuser-runtime.js
          -> Apps Script Web App
              -> Auth / session / role
              -> Record-level APIs
              -> Gmail
              -> Google Sheets event store
              -> tracked-link redirect
```

UI giữ ổn định; backend, auth và transport có thể thay đổi độc lập.

## 5. Multi-user model

Production không dùng whole-state last-write-wins.

Các mutation chuẩn:

- `upsert_school`
- `upsert_contact`
- `upsert_task`
- `upsert_opportunity`
- `delete_record`

Mỗi record có:

- `record_version`
- `updated_by`
- `updated_at`
- `deleted_at`

Client gửi `expected_version`. Nếu backend đã có version mới hơn, trả `RECORD_VERSION_CONFLICT` và client reload dữ liệu mới.

## 6. Authentication

Role:

- SUPER_ADMIN
- ADMIN
- LEADER
- STAFF

Staff login bằng email + password. Password được hash + salt. Session có hạn 12 giờ; backend chỉ lưu hash của session token.

`app-config.js` chỉ chứa backend URL và cấu hình không bí mật. API key không đưa vào frontend production.

## 7. Event model

Các event lõi:

- EMAIL_SENT
- LINK_CREATED
- LINK_OPENED
- MANUAL_ACTIVITY
- SCHOOL_UPSERTED
- CONTACT_UPSERTED
- TASK_UPSERTED
- OPPORTUNITY_UPSERTED
- RECORD_DELETED

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

## 8. Sales performance

Không dùng một điểm tổng duy nhất. Luôn tách:

- Nỗ lực
- Kỷ luật
- Chất lượng
- Kết quả

Không khuyến khích KPI tạo hành vi gọi/gửi email cho đủ số lượng.

## 9. Tracking

- Không suy diễn email mở = khách hàng quan tâm.
- Tracked document open là signal, không phải quyết định mua.
- Repeated views + reply + meeting mới tạo engagement mạnh.
- Mọi signal phải gắn `school_id` và nếu có thì `contact_id`/`opportunity_id`.
