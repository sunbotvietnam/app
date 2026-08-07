/**
 * SUNBOT MEDIA LIBRARY - ADMIN CATALOG V10
 *
 * Mục tiêu:
 * - Cho phép admin thêm năm học, trường, người nhập ảnh.
 * - Dùng chung cho app `impact 26.6`.
 * - Không thay đổi cấu trúc MEDIA_LIBRARY hiện tại.
 *
 * Cách tích hợp vào backend hiện tại:
 * Trong doPost, sau khi đã parse payload/action, đặt đoạn này trước nhánh Unknown action:
 *
 *   const catalogResult = handleMediaLibraryAdminCatalogAction_(action, payload);
 *   if (catalogResult) return jsonOutput_({ status: 'success', result: catalogResult });
 *
 * Nếu backend đang dùng hàm json_ thay vì jsonOutput_, đổi phần return cho đúng helper sẵn có.
 *
 * Trong route `media_library_config`, bọc kết quả config cũ:
 *
 *   result = mergeMediaCatalogConfig_(result);
 *
 * Trong route upload, sau khi có batch_meta, có thể kiểm tra người nhập:
 *
 *   validateMediaCatalogUploaderPin_(batch_meta.uploader_id, batch_meta.uploader_pin);
 */

const SUNBOT_MEDIA_ADMIN_CATALOG = {
  adminPin: '6868',
  sheets: {
    schools: 'MEDIA_REF_SCHOOLS',
    years: 'MEDIA_REF_YEARS',
    uploaders: 'MEDIA_REF_UPLOADERS'
  },
  defaultYears: [
    { year_id: 'before_2026', year_name: 'Trước 2026', active: 'TRUE' },
    { year_id: '2526', year_name: 'Năm học 2025-2026', active: 'TRUE' },
    { year_id: '2627', year_name: 'Năm học 2026-2027', active: 'TRUE' }
  ],
  defaultSchools: [
    { school_id: 'HN-SH', school_name: 'Hà Nội - Sen Hồng', active: 'TRUE' },
    { school_id: 'HN-BM', school_name: 'Hà Nội - Bình Minh', active: 'TRUE' },
    { school_id: 'HN-HD', school_name: 'Hà Nội - Hàng Đào', active: 'TRUE' },
    { school_id: 'HN-LTT', school_name: 'Hà Nội - Lê Trọng Tấn', active: 'TRUE' },
    { school_id: 'HN-HM', school_name: 'Hà Nội - Hoa Mai', active: 'TRUE' },
    { school_id: 'HN-SC', school_name: 'Hà Nội - Sơn Ca', active: 'TRUE' },
    { school_id: 'HN-QT', school_name: 'Hà Nội - Quang Trung', active: 'TRUE' },
    { school_id: 'HN-TH', school_name: 'Hà Nội - Tuổi Hoa', active: 'TRUE' },
    { school_id: 'HN-KC', school_name: 'Hà Nội - Kim Chung', active: 'TRUE' },
    { school_id: 'HN-HV', school_name: 'Hà Nội - Hà Vỹ', active: 'TRUE' },
    { school_id: 'HN-LD', school_name: 'Hà Nội - Linh Đàm', active: 'TRUE' },
    { school_id: 'HN-HAD', school_name: 'Hà Nội - Hoa Anh Đào', active: 'TRUE' },
    { school_id: 'HN-NT', school_name: 'Hà Nội - Ngọc Thụy', active: 'TRUE' },
    { school_id: 'HN-SD', school_name: 'Hà Nội - Sài Đồng', active: 'TRUE' },
    { school_id: 'HN-HT', school_name: 'Hà Nội - Hà Thắng', active: 'TRUE' },
    { school_id: 'HN-GREENERY', school_name: 'Hà Nội - Greenery', active: 'TRUE' },
    { school_id: 'HN-QTNB', school_name: 'Hà Nội - QT Nhật Bản', active: 'TRUE' },
    { school_id: 'HN-AMG', school_name: 'Hà Nội - AMG', active: 'TRUE' },
    { school_id: 'HN-BE', school_name: 'Hà Nội - Baby Enistein', active: 'TRUE' },
    { school_id: 'HN-BCM', school_name: 'Hà Nội - Bút Chì Màu', active: 'TRUE' },
    { school_id: 'HN-VHIQ', school_name: 'Hà Nội - Việt Hàn IQ', active: 'TRUE' },
    { school_id: 'HN-OPK', school_name: 'Hà Nội - Ocean Park Kids', active: 'TRUE' },
    { school_id: 'SL-STAR', school_name: 'Sơn La - Sơn La Star', active: 'TRUE' },
    { school_id: 'HN-VG', school_name: 'Hà Nội - Việt Genius', active: 'TRUE' },
    { school_id: 'HN-HW', school_name: 'Hà Nội - Happy World', active: 'TRUE' },
    { school_id: 'HN-HTN', school_name: 'Hà Nội - Hoa Trạng Nguyên', active: 'TRUE' },
    { school_id: 'HN-NOBEL', school_name: 'Hà Nội - Nobel', active: 'TRUE' },
    { school_id: 'HN-TGKN', school_name: 'Hà Nội - Thế giới kẹo ngọt', active: 'TRUE' },
    { school_id: 'PT-Z121', school_name: 'Phú Thọ - Z121', active: 'TRUE' },
    { school_id: 'HN-HH', school_name: 'Hà Nội - MN Hoa Hồng', active: 'TRUE' },
    { school_id: 'HN-TL', school_name: 'Hà Nội - MN Thanh Lâm', active: 'TRUE' },
    { school_id: 'HN-VSKTL', school_name: 'Hà Nội - MN VSK Thăng Long', active: 'TRUE' },
    { school_id: 'HD-HL', school_name: 'Hải Dương - MN Hoa Linh', active: 'TRUE' },
    { school_id: 'HD-KRN', school_name: 'Hải Dương - MN Khu rừng nhỏ', active: 'TRUE' },
    { school_id: 'HD-TB', school_name: 'Hải Dương - MN Thanh Bình', active: 'TRUE' },
    { school_id: 'HD-HTAN', school_name: 'Hải Dương - MN Hải Tân', active: 'TRUE' },
    { school_id: 'HD-QT', school_name: 'Hải Dương - MN Quyết Thắng', active: 'TRUE' },
    { school_id: 'HD-TT', school_name: 'Hải Dương - MN Tuổi Thơ', active: 'TRUE' },
    { school_id: 'HD-HPHONG', school_name: 'Hải Dương - MN Hồng Phong', active: 'TRUE' },
    { school_id: 'HD-LH', school_name: 'Hải Dương - MN Liên Hồng', active: 'TRUE' },
    { school_id: 'HD-GL', school_name: 'Hải Dương - MN Thị trấn Gia Lộc', active: 'TRUE' },
    { school_id: 'HD-HOTIEN', school_name: 'Hải Dương - MN Hoàng Tiến', active: 'TRUE' },
    { school_id: 'BG-HV', school_name: 'Bắc Giang - MN Hương Vĩ', active: 'TRUE' },
    { school_id: 'HD-UH1', school_name: 'Hải Dương - MN Ứng Hòe 1', active: 'TRUE' },
    { school_id: 'HD-UH2', school_name: 'Hải Dương - MN Ứng Hòe 2', active: 'TRUE' },
    { school_id: 'HD-HA', school_name: 'Hải Dương - MN Hiệp An', active: 'TRUE' },
    { school_id: 'HD-GK', school_name: 'Hải Dương - MN Gia Khánh', active: 'TRUE' },
    { school_id: 'HD-DQ', school_name: 'Hải Dương - MN Đồng Quang', active: 'TRUE' },
    { school_id: 'HCM-HP', school_name: 'Hồ Chí Minh - MN Hoa Phượng', active: 'TRUE' },
    { school_id: 'HD-TTHAN', school_name: 'Hải Dương - MN Thiên Thần', active: 'TRUE' },
    { school_id: 'TB-TV', school_name: 'Thái Bình - MN Tâm Việt', active: 'TRUE' },
    { school_id: 'LC-BM', school_name: 'Lào Cai - MN Bình Minh', active: 'TRUE' },
    { school_id: 'LC-HH', school_name: 'Lào Cai - MN Hoa Hồng', active: 'TRUE' },
    { school_id: 'HD-TV', school_name: 'Hải Dương - MN Tuấn Việt', active: 'TRUE' },
    { school_id: 'HP-SUNBOT', school_name: 'Hải Phòng - Sunbot Hải Phòng', active: 'TRUE' },
    { school_id: 'HD-NT', school_name: 'Hải Dương - MN Nguyễn Trãi', active: 'TRUE' },
    { school_id: 'BG-TTNN', school_name: 'Bắc Giang - MN TT Nhã Nam', active: 'TRUE' },
    { school_id: 'QN-HMN', school_name: 'Quảng Ninh - MN Hạt Mầm Nhỏ', active: 'TRUE' },
    { school_id: 'HCM-SRIGHT', school_name: 'Hồ Chí Minh - MN S-Right', active: 'TRUE' },
    { school_id: 'HD-TM', school_name: 'Hải Dương - MN Tứ Minh', active: 'TRUE' },
    { school_id: 'BG-BH', school_name: 'Bắc Giang - MN Bố Hạ', active: 'TRUE' },
    { school_id: 'HD-LCACH', school_name: 'Hải Dương - MN Thị trấn Lai Cách', active: 'TRUE' },
    { school_id: 'VT-SFG', school_name: 'Vũng Tàu - MN Sunflower Garden', active: 'TRUE' },
    { school_id: 'HCM-NOVAKIDS', school_name: 'Hồ Chí Minh - MN Novakids', active: 'TRUE' },
    { school_id: 'NA-LL', school_name: 'Nghệ An - Lê Lợi', active: 'TRUE' },
    { school_id: 'NA-GREEN', school_name: 'Nghệ An - Green', active: 'TRUE' }
  ],
  defaultUploaders: [
    { teacher_id: 'TCH-TTH-001', teacher_name: 'Trần Thị Hằng', teacher_pin: '1234', active: 'TRUE' },
    { teacher_id: 'TCH-MVD-002', teacher_name: 'Mong Văn Dương', teacher_pin: '5678', active: 'TRUE' },
    { teacher_id: 'TCH-NTD-003', teacher_name: 'Nguyễn Thị Danh', teacher_pin: '9012', active: 'TRUE' },
    { teacher_id: 'TCH-ĐTLP-004', teacher_name: 'Đậu Thị Lan Phương', teacher_pin: '3456', active: 'TRUE' },
    { teacher_id: 'TCH-TPA-005', teacher_name: 'Trần Phương Anh', teacher_pin: '7890', active: 'TRUE' },
    { teacher_id: 'TCH-TTL-006', teacher_name: 'Trịnh Thị Lý', teacher_pin: '1234', active: 'TRUE' },
    { teacher_id: 'TCH-ĐTMH-007', teacher_name: 'Đỗ Thị Minh Hằng', teacher_pin: '5678', active: 'TRUE' },
    { teacher_id: 'TCH-NTP-008', teacher_name: 'Nguyễn Thị Phương', teacher_pin: '9012', active: 'TRUE' },
    { teacher_id: 'TCH-TPT-009', teacher_name: 'Trần Phương Thảo', teacher_pin: '3456', active: 'TRUE' },
    { teacher_id: 'TCH-ĐTL-010', teacher_name: 'Đặng Thái Ly', teacher_pin: '7890', active: 'TRUE' },
    { teacher_id: 'TCH-PTTH-011', teacher_name: 'Phan Thị Thu Hạnh', teacher_pin: '1234', active: 'TRUE' },
    { teacher_id: 'TCH-LTD-012', teacher_name: 'Lê Thị Dung', teacher_pin: '5678', active: 'TRUE' },
    { teacher_id: 'TCH-ĐTLP-013', teacher_name: 'Đậu Thị Lan Phương', teacher_pin: '9012', active: 'TRUE' },
    { teacher_id: 'TCH-NTA-014', teacher_name: 'Minh Thu', teacher_pin: '3456', active: 'TRUE' },
    { teacher_id: 'UP-HOANG-NHUNG', teacher_name: 'Hoàng Nhung', teacher_pin: '1234', active: 'TRUE' }
  ]
};

function handleMediaLibraryAdminCatalogAction_(action, payload) {
  const data = payload && payload.data ? payload.data : {};
  if (action === 'media_library_admin_upsert_year') {
    requireMediaCatalogAdmin_(data.admin_pin);
    return upsertMediaCatalogYear_(data.year || {});
  }
  if (action === 'media_library_admin_upsert_school') {
    requireMediaCatalogAdmin_(data.admin_pin);
    return upsertMediaCatalogSchool_(data.school || {});
  }
  if (action === 'media_library_admin_upsert_uploader') {
    requireMediaCatalogAdmin_(data.admin_pin);
    return upsertMediaCatalogUploader_(data.uploader || {});
  }
  if (action === 'media_library_admin_seed_defaults') {
    requireMediaCatalogAdmin_(data.admin_pin);
    return seedMediaCatalogDefaults_(data);
  }
  return null;
}

function seedMediaCatalogDefaults_(data) {
  setupMediaCatalogSheets_();
  const years = data.years && data.years.length ? data.years : SUNBOT_MEDIA_ADMIN_CATALOG.defaultYears;
  const schools = data.schools && data.schools.length ? data.schools : SUNBOT_MEDIA_ADMIN_CATALOG.defaultSchools;
  const uploaders = data.uploaders && data.uploaders.length ? data.uploaders : SUNBOT_MEDIA_ADMIN_CATALOG.defaultUploaders;

  years.forEach(upsertMediaCatalogYear_);
  schools.forEach(upsertMediaCatalogSchool_);
  uploaders.forEach(upsertMediaCatalogUploader_);

  return {
    years: years.length,
    schools: schools.length,
    uploaders: uploaders.length
  };
}

function upsertMediaCatalogYear_(year) {
  setupMediaCatalogSheets_();
  const row = {
    year_id: String(year.year_id || '').trim(),
    year_name: String(year.year_name || '').trim(),
    active: mediaCatalogBool_(year.active, 'TRUE'),
    updated_at: mediaCatalogNow_()
  };
  if (!row.year_id || !row.year_name) throw new Error('Thiếu year_id hoặc year_name.');
  mediaCatalogUpsert_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.years, 'year_id', row);
  return row;
}

function upsertMediaCatalogSchool_(school) {
  setupMediaCatalogSheets_();
  const name = String(school.school_name || '').trim();
  const row = {
    school_id: String(school.school_id || mediaCatalogSchoolId_(name)).trim(),
    school_name: name,
    active: mediaCatalogBool_(school.active, 'TRUE'),
    updated_at: mediaCatalogNow_()
  };
  if (!row.school_id || !row.school_name) throw new Error('Thiếu school_id hoặc school_name.');
  mediaCatalogUpsert_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.schools, 'school_id', row);
  return row;
}

function upsertMediaCatalogUploader_(uploader) {
  setupMediaCatalogSheets_();
  const name = String(uploader.teacher_name || uploader.uploader_name || '').trim();
  const row = {
    teacher_id: String(uploader.teacher_id || mediaCatalogUploaderId_(name)).trim(),
    teacher_name: name,
    teacher_pin: String(uploader.teacher_pin || uploader.uploader_pin || uploader.pin || '').trim(),
    teacher_email: String(uploader.teacher_email || uploader.email || '').trim(),
    active: mediaCatalogBool_(uploader.active, 'TRUE'),
    updated_at: mediaCatalogNow_()
  };
  if (!row.teacher_id || !row.teacher_name || !row.teacher_pin) {
    throw new Error('Thiếu teacher_id, teacher_name hoặc teacher_pin.');
  }
  mediaCatalogUpsert_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.uploaders, 'teacher_id', row);
  return row;
}

function setupMediaCatalogSheets_() {
  mediaCatalogEnsureSheet_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.years, ['year_id','year_name','active','updated_at']);
  mediaCatalogEnsureSheet_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.schools, ['school_id','school_name','active','updated_at']);
  mediaCatalogEnsureSheet_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.uploaders, ['teacher_id','teacher_name','teacher_pin','teacher_email','active','updated_at']);
}

function getMediaCatalogConfigOverlay_() {
  setupMediaCatalogSheets_();
  return {
    years: mediaCatalogReadObjects_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.years).filter(mediaCatalogIsActive_),
    schools: mediaCatalogReadObjects_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.schools).filter(mediaCatalogIsActive_),
    teachers: mediaCatalogReadObjects_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.uploaders).filter(mediaCatalogIsActive_)
  };
}

function mergeMediaCatalogConfig_(config) {
  const base = config || {};
  const overlay = getMediaCatalogConfigOverlay_();
  base.years = mediaCatalogMergeBy_([].concat(base.years || [], overlay.years || []), 'year_id');
  base.schools = mediaCatalogMergeBy_([].concat(base.schools || [], overlay.schools || []), 'school_id');
  base.teachers = mediaCatalogMergeBy_([].concat(base.teachers || [], overlay.teachers || []), 'teacher_id');
  return base;
}

function validateMediaCatalogUploaderPin_(uploaderId, pin) {
  if (!uploaderId) throw new Error('Thiếu người nhập ảnh.');
  const uploaders = mediaCatalogReadObjects_(SUNBOT_MEDIA_ADMIN_CATALOG.sheets.uploaders);
  const found = uploaders.find(function(u) {
    return String(u.teacher_id || '').trim() === String(uploaderId || '').trim();
  });
  if (!found) return true;
  const savedPin = String(found.teacher_pin || '').trim();
  if (savedPin && String(pin || '').trim() !== savedPin) {
    throw new Error('Mật khẩu người nhập không đúng.');
  }
  return true;
}

function requireMediaCatalogAdmin_(pin) {
  if (String(pin || '').trim() !== SUNBOT_MEDIA_ADMIN_CATALOG.adminPin) {
    throw new Error('Admin PIN không đúng.');
  }
}

function mediaCatalogUpsert_(sheetName, key, obj) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const keyIndex = headers.indexOf(key);
  if (keyIndex < 0) throw new Error('Sheet thiếu cột key: ' + key);

  let targetRow = -1;
  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i][keyIndex] || '').trim() === String(obj[key] || '').trim()) {
      targetRow = i + 1;
      break;
    }
  }

  const row = headers.map(function(h) { return obj[h] == null ? '' : obj[h]; });
  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function mediaCatalogEnsureSheet_(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }
  const first = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn())).getValues()[0].map(String);
  headers.forEach(function(header, idx) {
    if (first.indexOf(header) < 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
    } else if (!first[idx]) {
      sheet.getRange(1, idx + 1).setValue(header);
    }
  });
  return sheet;
}

function mediaCatalogReadObjects_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(function(h) { return String(h).trim(); });
  return values
    .filter(function(row) { return row.some(function(cell) { return cell !== '' && cell != null; }); })
    .map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
}

function mediaCatalogMergeBy_(rows, key) {
  const map = {};
  (rows || []).forEach(function(row) {
    const id = String(row[key] || '').trim();
    if (!id) return;
    map[id] = Object.assign(map[id] || {}, row);
  });
  return Object.keys(map).map(function(id) { return map[id]; });
}

function mediaCatalogIsActive_(row) {
  const active = String(row.active == null ? 'TRUE' : row.active).trim().toLowerCase();
  return ['true','1','yes','active','đang dùng','dang dung'].indexOf(active) >= 0;
}

function mediaCatalogSchoolId_(name) {
  return 'SCH-' + mediaCatalogAsciiSlug_(name).slice(0, 36);
}

function mediaCatalogUploaderId_(name) {
  return 'UP-' + mediaCatalogAsciiSlug_(name).slice(0, 36);
}

function mediaCatalogAsciiSlug_(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'NEW';
}

function mediaCatalogBool_(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
}

function mediaCatalogNow_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss');
}
