# Sunbot Operating Platform - System Blueprint V2

## 1. Muc tieu

Blueprint nay dat nen cho Sunbot Operating Platform theo huong:

- Gon, de van hanh boi doi ngu khong chuyen cong nghe.
- Co the nhan ban cho truong, doi tac, franchise ma khong lan du lieu.
- Van giu duoc tong quan he thong cho Sunbot Head.
- Co phan quyen ro rang, tranh cap quyen rong qua muc can thiet.
- Toc do truy cap tot khi du lieu tang theo nam hoc.
- Phu hop stack hien tai: Google Sheets, Apps Script, GitHub Pages, single-file HTML.

Quyet dinh lon:

```text
1 frontend chung
1 auth/config backend trung tam
1 tenant HEAD dau tien
co school_year tu dau
co enrollment theo nam hoc
co role + tenant scope
co monthly summary de tang toc
co kha nang tach data backend theo tenant khi can
```

## 2. Khai niem loi

### 2.1 Tenant

Tenant la don vi van hanh co du lieu va pham vi quan tri rieng.

Vi du:

```text
HEAD                  Sunbot Head
SCHOOL_HN_ABC         Truong ABC Ha Noi
PARTNER_NA_01         Doi tac Nghe An 01
FRANCHISE_DN_01       Franchise Da Nang 01
```

Moi user luon co it nhat mot tenant.

### 2.2 School Year

Nam hoc la khoa phan vung du lieu bat buoc.

Khong duoc chi dung ten lop nhu A1, B1, 4A vi ten lop se duoc tai su dung qua tung nam.

```text
SY_2025_2026
SY_2026_2027
```

Moi class, enrollment, session, assessment, certificate phai gan `school_year_id`.

### 2.3 Student va Enrollment

Hoc sinh khong thuoc truc tiep vinh vien vao mot lop.

Dung mo hinh:

```text
STUDENTS     ho so tre
ENROLLMENTS  tre thuoc lop nao trong nam hoc nao
```

Vi du:

```text
student_id: STU_0001
2025-2026: class_id HEAD_HN_ABC_2526_A1
2026-2027: class_id HEAD_HN_ABC_2627_B1
```

Khong sua du lieu nam cu khi tre len lop. Tao enrollment moi cho nam hoc moi.

### 2.4 Student Journey

Tach `STUDENTS` va `ENROLLMENTS` khong lam mat lien ket hanh trinh cua tre.

Nguyen tac:

```text
student_id la dinh danh xuyen nam hoc
enrollment_id la lan ghi danh trong mot nam hoc/cu lop cu the
```

Mot tre hoc toi da 3 nam voi Sunbot se co mot `student_id` va nhieu enrollment:

```text
STU_0001
  ENR_0001 | SY_2025_2026 | Lop A1
  ENR_0002 | SY_2026_2027 | Lop B1
  ENR_0003 | SY_2027_2028 | Lop C1
```

Khi xem hanh trinh hoc tap:

```text
student_id
-> all enrollments
-> all sessions
-> all assessments
-> all certificates
```

Can co API:

```text
get_student_journey(token, tenant_id, student_id)
```

API nay tra ve hanh trinh 1-3 nam hoc cua tre, phuc vu:

- chung nhan cuoi chuong trinh
- danh gia tien bo
- bao cao phu huynh/truong
- phan tich tac dong hoc tap

## 3. Kien truc tong the

```text
Sunbot GitHub Pages Frontend
  |
  | login / config / tenant registry
  v
Central Auth & Config Backend
  - USERS
  - ROLES
  - PERMISSIONS
  - TENANTS
  - USER_TENANT_ACCESS
  - TENANT_SETTINGS
  - AUDIT_LOGS
  |
  | route theo tenant + school_year
  v
Tenant Data Backend(s)
  - HEAD backend
  - School backend neu can
  - Partner backend neu can
  |
  | scheduled sync / summary
  v
Central Analytics
  - du lieu tong hop de Head xem toan he thong
```

Giai doan dau chi can:

```text
Frontend chung
Central Auth & Config Backend
HEAD Data Backend
```

Chua can tach backend rieng cho tung truong neu du lieu va nhu cau chua du lon.

## 4. User strategy

Khong tao user cho moi ben lien quan mot cach mac dinh.

Quy tac:

```text
Can thao tac thuong xuyen      => tao user
Can xem dashboard thuong xuyen => tao user viewer
Chi can nam tinh hinh          => gui email/report dinh ky
Chi can ho so/chung nhan       => SUPER_ADMIN xuat report khi can
```

### 4.1 Hieu truong / truong

Mac dinh:

```text
Khong tao user rieng
Nhan bao cao dinh ky qua email hoac link bao cao
```

Chi tao user `SCHOOL_VIEWER` hoac `SCHOOL_ADMIN` khi truong can:

- Tu vao dashboard bat cu luc nao.
- Xem theo lop/thang/hoc sinh.
- Tai minh chung.
- Duyet/xac nhan bao cao.
- Co nhieu nguoi trong truong cung su dung.
- La truong/doi tac chien luoc.

### 4.2 Doi tac / franchise

Nen co tenant va user rieng.

Ly do: doi tac/franchise can quan ly doanh thu, trien khai, KPI, giao vien, truong, lop, hoc lieu va chat luong trong pham vi cua ho.

Role phu hop:

```text
TENANT_ADMIN
PARTNER_MANAGER
PARTNER_VIEWER
```

## 5. Role model

Role phai di kem scope. Khong co "admin chung chung".

### 5.1 Role chuan

```text
SUPER_ADMIN
SYSTEM_ADMIN
HEAD_ADMIN
REGION_ADMIN
TENANT_ADMIN
TEACHER
SCHOOL_VIEWER
PARTNER_VIEWER
CURRICULUM
OPS_VIEWER
```

### 5.2 Mo ta role

| Role | Pham vi | Ghi chu |
|---|---|---|
| SUPER_ADMIN | Toan he thong | Admin cao cap nhat, thao tac nhay cam can ma 1906 |
| SYSTEM_ADMIN | Toan he thong co gioi han | Quan ly user, tenant, cau hinh, tru thao tac toi cao |
| HEAD_ADMIN | Tenant HEAD | Quan ly noi bo Sunbot Head |
| REGION_ADMIN | Region trong HEAD | Vi du HN hoac NA |
| TENANT_ADMIN | Mot tenant | Quan tri truong/doi tac/franchise |
| TEACHER | User ca nhan | Bao cao ca hoc, danh gia, hoc vien, thu nhap ca nhan |
| SCHOOL_VIEWER | Mot truong | Xem bao cao/minh chung, khong sua du lieu goc |
| PARTNER_VIEWER | Mot partner tenant | Xem KPI, doanh thu, trien khai |
| CURRICULUM | Cross-tenant co gioi han | Xem bai hoc, coverage, hoc lieu, QA chuyen mon |
| OPS_VIEWER | Cross-tenant co gioi han | Xem van hanh, audit, doi soat |

### 5.3 Ma xac nhan 1906

Chi `SUPER_ADMIN` moi dung ma 1906.

Can ma 1906 cho:

- Cap hoac nang quyen `SUPER_ADMIN`.
- Doi backend URL cua tenant.
- Doi cau hinh toan cuc.
- Vo hieu hoa tenant.
- Reset mat khau admin khac.
- Export du lieu toan he thong.
- Xem/ghi du lieu xuyen tenant ngoai pham vi role.
- Xoa mem du lieu quan trong.

Khong can ma 1906 cho:

- Giao vien gui bao cao.
- Admin truong xem dashboard truong.
- Region admin xem du lieu vung.
- Doi tac xem KPI tenant cua minh.

## 6. Data schema trung tam

### 6.1 TENANTS

```text
tenant_id
tenant_name
tenant_type          HEAD | SCHOOL | PARTNER | FRANCHISE
parent_tenant_id
default_region
data_backend_url
settings_json
status               ACTIVE | PAUSED | ARCHIVED
created_at
updated_at
```

### 6.2 SCHOOL_YEARS

```text
school_year_id       SY_2025_2026
name                 2025-2026
start_date
end_date
status               ACTIVE | CLOSED | PLANNING
sort_order
```

Chi nen co mot school year active mac dinh, nhung app phai cho SUPER_ADMIN/ADMIN chon nam hoc cu khi can.

### 6.3 USERS

```text
user_id
username
password_hash_or_pin
display_name
email
phone
primary_tenant_id
default_school_year_id
status               ACTIVE | LOCKED | ARCHIVED
last_login_at
created_at
updated_at
```

Ghi chu: neu backend hien tai dang dung PIN plaintext thi giai doan sau nen nang len hash. Neu chua lam hash ngay, toi thieu khong expose password/PIN ra frontend.

### 6.4 USER_TENANT_ACCESS

```text
access_id
user_id
tenant_id
role
region_scope         HN | NA | ALL | blank
school_scope_json
class_scope_json
effective_from
effective_to
status
```

Day la bang quan trong nhat de user co the:

- Chi thuoc HEAD.
- Thuoc mot truong.
- Thuoc nhieu tenant.
- La admin HN nhung khong xem NA.

### 6.5 TENANT_SETTINGS

```text
tenant_id
setting_key
setting_value
scope                TENANT | GLOBAL
updated_by
updated_at
```

Vi du:

```text
internal_center_url
data_backend_url
daily_report_recipients
weekly_report_recipients
logo_url
primary_color
```

### 6.6 AUDIT_LOGS

```text
log_id
timestamp
actor_user_id
actor_role
tenant_id
action
target_type
target_id
before_json
after_json
requires_super_code
result
ip_or_device_hint
```

Moi thao tac admin nen ghi log.

## 7. Data schema tenant

Moi tenant data backend nen co schema giong nhau de frontend dung chung.

### 7.1 SCHOOLS

```text
school_id
tenant_id
school_name
region
province
district
contact_name
contact_email
status
```

### 7.2 CLASSES

```text
class_id
tenant_id
school_year_id
school_id
class_name
age_group
expected_children
status               ACTIVE | CLOSED | ARCHIVED
```

Quy tac tao `class_id`:

```text
{tenant_id}_{school_code}_{YY1YY2}_{class_name_normalized}
```

Vi du:

```text
HEAD_HNABC_2526_A1
HEAD_HNABC_2627_A1
```

### 7.3 STUDENTS

```text
student_id
tenant_id
full_name
dob
gender
guardian_name
guardian_phone
global_note
status
```

### 7.4 ENROLLMENTS

```text
enrollment_id
tenant_id
school_year_id
school_id
class_id
student_id
enrollment_status    ACTIVE | TRANSFERRED | GRADUATED | LEFT | PAUSED
start_date
end_date
note
```

### 7.5 TEACHERS

```text
teacher_id
tenant_id
full_name
region
employment_type      INTERNAL | SCHOOL | PARTNER
manager_user_id
status
```

Toan bo giao vien co huu hien tai dua vao:

```text
tenant_id = HEAD
employment_type = INTERNAL
```

### 7.6 CLASS_SESSIONS

```text
session_id
tenant_id
school_year_id
school_id
class_id
teacher_id
lesson_id
session_date
session_month        YYYY-MM
attendance_count
class_count
status
quality_flags_json
created_at
submitted_at
```

### 7.7 SESSION_MEDIA

```text
media_id
tenant_id
school_year_id
session_id
media_type
drive_url
caption
uploaded_by
created_at
```

### 7.8 ASSESSMENTS

```text
assessment_id
tenant_id
school_year_id
school_id
class_id
student_id
teacher_id
period               MONTHLY | TERM | YEAR_END
assessment_json
status
created_at
submitted_at
```

### 7.9 CERTIFICATES

```text
certificate_id
tenant_id
school_year_id
school_id
class_id
student_id
certificate_type
issue_status         DRAFT | READY | ISSUED | SENT
source_assessment_id
generated_url
issued_at
```

### 7.10 MONTHLY_SUMMARY

Bang nay bat buoc de tang toc dashboard.

```text
summary_id
tenant_id
school_year_id
month
school_id
class_id
teacher_id
sessions_count
teaching_units
attendance_total
unique_students
lessons_count
qa_flags_count
missing_photo_count
checklist_fail_count
updated_at
```

Frontend mo dashboard doc `MONTHLY_SUMMARY` truoc. Chi bam vao chi so moi doc chi tiet.

## 8. API contract V2

Moi request tu frontend nen co:

```text
action
token
tenant_id
school_year_id
month
filters
```

### 8.1 Auth/config APIs

```text
login(username, password)
sync_portal(token)
get_user_context(token)
get_tenants(token)
get_hub_settings(token, tenant_id)
update_hub_settings(token, tenant_id, settings, super_code_if_required)
```

Response `get_user_context`:

```json
{
  "success": true,
  "user": {
    "user_id": "U001",
    "display_name": "Nguyen Tuong Van",
    "primary_tenant_id": "HEAD"
  },
  "access": [
    {
      "tenant_id": "HEAD",
      "role": "SUPER_ADMIN",
      "region_scope": "ALL"
    }
  ],
  "active_school_year": "SY_2025_2026",
  "permissions": {
    "can_manage_accounts": true,
    "can_manage_tenants": true,
    "can_view_global_analytics": true
  }
}
```

### 8.2 Tenant data APIs

```text
get_dashboard_summary(token, tenant_id, school_year_id, month)
get_dashboard_detail(token, tenant_id, school_year_id, month, metric, filters)
get_report_config(token, tenant_id, school_year_id)
submit_class_session_report(token, payload)
get_my_reports(token, tenant_id, school_year_id, period)
get_assessment_students(token, tenant_id, school_year_id, class_id)
submit_assessment(token, payload)
get_certificate_candidates(token, tenant_id, school_year_id, filters)
```

### 8.3 Reporting APIs

```text
send_daily_leader_report(token, tenant_id, date)
send_weekly_leader_report(token, tenant_id, week)
generate_school_report(token, tenant_id, school_year_id, school_id, month)
generate_partner_report(token, tenant_id, school_year_id, month)
export_global_analytics(token, school_year_id, filters, super_code)
```

### 8.4 Provisioning APIs

Dung cho SUPER_ADMIN tao tenant/truong/doi tac tu frontend.

```text
provision_tenant_v2(token, super_code, tenant, adminUser)
get_tenants_v2(token)
test_tenant_backend(token, super_code, tenant_id)
update_tenant_backend_url(token, super_code, tenant_id, data_backend_url)
archive_tenant(token, super_code, tenant_id)
```

`provision_tenant_v2` nen tao/cap nhat:

```text
TENANTS
TENANT_SETTINGS
SCHOOL_YEARS neu chua co
USERS cho admin tenant neu co nhap
USER_TENANT_ACCESS
AUDIT_LOGS
```

Frontend chi duoc hien thi "Backend da xac nhan" khi response co:

```text
success = true
tenant_id
message hoac audit_log_id neu co
```

Neu request da gui nhung backend loi/khong co action, frontend phai hien thi "Chua tao duoc tenant tren backend" va luu lich su thao tac local de SUPER_ADMIN biet trang thai.

Backend cho cac action nay da duoc trien khai truc tiep vao Training/Auth Apps Script project trong file `ProvisioningV2.js` va route tu dispatcher `doPost`.

Trang thai tenant:

```text
ACTIVE            da dung duoc
NEEDS_BACKEND_URL can dan backend URL rieng
PROVISIONING      dang tao tai nguyen
ERROR             tao loi, can xu ly
PAUSED            tam dung
ARCHIVED          luu tru
```

Giai doan dau:

```text
Frontend tao tenant + ghi config trung tam
Backend rieng neu can thi admin dan data_backend_url
```

Giai doan sau:

```text
Tu copy Google Sheet template
Tu gan cau hinh
Tu test connection
Tu cap nhat tenant thanh ACTIVE
```

## 9. Frontend behavior

Sau dang nhap, frontend phai:

```text
1. Lay user context.
2. Xac dinh tenant mac dinh.
3. Xac dinh school_year active.
4. Tai config theo tenant + school_year.
5. Hien thi module theo permissions.
```

### 9.1 Teacher

Hien:

- Bao cao ca hoc.
- Danh gia tre neu duoc cap.
- Hoc vien.
- Thu nhap cua toi.
- Bao cao cua toi.
- Trung tam dieu hanh neu duoc cau hinh.

Tu dong:

- Lock teacher theo tai khoan.
- Chi doc du lieu tenant/school_year hien hanh.

### 9.2 Tenant admin

Hien them:

- Dashboard tenant.
- Quan ly giao vien tenant.
- Quan ly lop/hoc sinh tenant.
- Bao cao truong/doi tac.
- Cau hinh link tenant neu duoc cap.

Khong hien:

- Cau hinh toan cuc.
- Tao SUPER_ADMIN.
- Export global.

### 9.3 SUPER_ADMIN

Hien:

- Tenant switcher.
- School year switcher.
- Global analytics.
- Account management.
- Tenant management.
- Export/chung nhan/danh gia toan he thong.

Thao tac nhay cam can ma 1906.

## 10. Bao cao cho cac ben lien quan

### 10.1 Hieu truong

Mac dinh dung email/report, khong can user.

Bao cao nen gom:

- So buoi da hoc trong thang.
- Lop nao da hoc bai nao.
- Si so trung binh.
- Anh minh chung tieu bieu.
- Giao vien phu trach.
- Diem can luu y neu co.

Chi tao user khi truong can dashboard thuong xuyen.

### 10.2 Partner / franchise

Nen co user va tenant rieng.

Dashboard nen gom:

- Doanh thu/trang thai doi soat.
- So truong dang trien khai.
- So lop/hoc sinh.
- So buoi day.
- Giao vien dang hoat dong.
- Tinh trang bao cao.
- Chat luong/QA flags.
- Coverage bai hoc.

### 10.3 Sunbot Head

Can dashboard tong:

- Tong so tenant/truong/lop/hoc sinh.
- Tong so buoi theo thang.
- Giao vien day nhieu/it.
- Truong/tenant dang tang truong.
- Truong/tenant co loi du lieu.
- Chung nhan can xuat.
- Danh gia hoc sinh can hoan thien.
- Bao cao doanh thu va trien khai.

## 11. Performance strategy

### 11.1 Nguyen tac

Khong API nao duoc doc toan bo sheet neu khong phai job backend.

Frontend luon goi theo:

```text
tenant_id
school_year_id
month
filters
```

### 11.2 Cache

Dung 3 tang:

```text
LocalStorage frontend
- cache config, school year, tenant settings
- TTL 6-12 gio

Apps Script CacheService
- cache dashboard summary va config
- TTL ngan 5-30 phut

Summary sheets
- MONTHLY_SUMMARY la nguon nhanh chinh
- cap nhat bang trigger hoac khi submit report
```

### 11.3 Detail on demand

Dashboard chi hien tong hop.

Khi nguoi dung bam vao:

```text
10 buoi day
3 loi checklist
5 hoc sinh can danh gia
```

Thi moi goi API chi tiet.

### 11.4 Anh/media

Khong tai anh khi mo dashboard.

Chi tai:

- thumbnail neu co
- link Drive
- gallery theo filter rieng

## 12. Migration plan

### Phase 0 - Dong bang schema hien tai

Khong sua app lon.

Lam:

- Lap danh sach sheet dang dung.
- Xac dinh cot nao dang co the map sang tenant/year.
- Backup sheet.
- Tao file mapping.

### Phase 1 - Them lop identity/tenant/year

Them bang:

```text
TENANTS
SCHOOL_YEARS
USER_TENANT_ACCESS
TENANT_SETTINGS
```

Tao:

```text
tenant_id = HEAD
school_year_id = SY_2025_2026
```

Gan toan bo du lieu hien tai:

```text
tenant_id = HEAD
school_year_id = SY_2025_2026
```

Them frontend SUPER_ADMIN:

```text
Quan tri he thong V2
- tao tenant HEAD/SCHOOL/PARTNER/FRANCHISE
- chon backend chung/rieng
- gan school_year active
- tao admin tenant ban dau
- goi action provision_tenant_v2
```

Neu backend chua ho tro `provision_tenant_v2`, frontend chi bao loi va khong anh huong app giao vien.

### Phase 2 - Chuan hoa class/enrollment

Them:

```text
class_id theo nam hoc
ENROLLMENTS
```

Khong xoa du lieu cu. Tao mapping:

```text
old_class_id -> new_class_id
student -> enrollment
```

### Phase 3 - API V2 song song V1

Tao API moi:

```text
get_user_context
get_dashboard_summary
get_dashboard_detail
get_report_config_v2
```

V1 van chay.

### Phase 4 - Frontend dung tenant/year

Hub sau dang nhap:

- Lay user context.
- Tu chon tenant/year.
- Goi API V2.
- V1 fallback neu can.

### Phase 5 - Summary va reports

Tao:

```text
MONTHLY_SUMMARY
scheduled refresh
daily report
weekly report
school report
partner report
```

### Phase 6 - Tach tenant backend neu can

Chi tach khi:

- Doi tac/franchise co du lieu rieng lon.
- Truong yeu cau data boundary ro.
- Sheet HEAD qua lon.
- Can phan quyen Drive/Apps Script rieng.

## 13. Guardrails

Khong lam:

- Khong tao user cho moi hieu truong neu chi can nhan report.
- Khong tach backend tung truong qua som.
- Khong dung class_name lam khoa du lieu.
- Khong sua ho so hoc sinh nam cu khi sang nam hoc moi.
- Khong cho frontend loc quyen thay backend.
- Khong doc toan bo sessions khi mo app.
- Khong cap role admin ma khong co tenant scope.

Bat buoc lam:

- Moi record van hanh co `tenant_id`.
- Moi record hoc tap/ca hoc/danh gia/chung nhan co `school_year_id`.
- Moi API backend tu kiem tra token + role + tenant scope.
- Moi thao tac admin quan trong ghi audit log.
- Moi thao tac SUPER_ADMIN nhay cam can ma 1906.
- Moi dashboard doc summary truoc, detail sau.

## 14. Quyet dinh de trien khai

Quyet dinh de bat dau V2:

```text
Tenant dau tien: HEAD
School year dau tien: SY_2025_2026
Frontend: giu sunbotvietnam.github.io/app
Auth backend: training backend hien tai, mo rong schema
Data backend: teaching/report backend hien tai, bo sung tenant/year
SUPER_ADMIN hien tai: admin dang dung
Hieu truong: mac dinh nhan report, chua tao user
Partner/franchise: tao tenant + user khi co doi tac van hanh that
```

## 15. Checklist truoc khi code

Truoc khi sua backend/frontend, can co:

- [ ] Xac dinh school year hien hanh.
- [ ] Xac dinh admin hien tai la SUPER_ADMIN.
- [ ] Xac dinh danh sach giao vien HEAD.
- [ ] Xac dinh region HN/NA cho giao vien.
- [ ] Tao bang TENANTS.
- [ ] Tao bang SCHOOL_YEARS.
- [ ] Tao bang USER_TENANT_ACCESS.
- [ ] Tao bang TENANT_SETTINGS.
- [ ] Tao mapping class hien tai sang class_id co school_year.
- [ ] Tao quy tac enrollment.
- [ ] Tao API `get_user_context`.
- [ ] Tao API `get_report_config_v2`.
- [ ] Tao API `get_dashboard_summary`.
- [ ] Tao audit log cho admin actions.
