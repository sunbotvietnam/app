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
    { year_id: '2425', year_name: '2024-2025', active: 'TRUE' },
    { year_id: '2526', year_name: '2025-2026', active: 'TRUE' },
    { year_id: '2627', year_name: '2026-2027', active: 'TRUE' }
  ],
  defaultSchools: [
    'Sen Hồng','Bình Minh','Hàng Đào','Lê Trọng Tấn','Hoa Mai','Sơn Ca','Quang Trung','Tuổi Hoa','Kim Chung','Hà Vỹ',
    'Linh Đàm','Hoa Anh Đào','Ngọc Thụy','Sài Đồng','Hà Thắng','Greenery','Green NA','Lê Lợi NA','QT Nhật Bản','AMG','Baby Enistein','Bút Chì Màu',
    'Việt Hàn IQ','Ocean Park Kids','Sơn La Star','Việt Genius','Happy World','Hoa Trạng Nguyên','Nobel','Thế giới kẹo ngọt',
    'Z121','MN Hoa Hồng','MN Thanh Lâm','VSK Thăng Long'
  ],
  defaultUploaders: [
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
  const schools = data.schools && data.schools.length ? data.schools : SUNBOT_MEDIA_ADMIN_CATALOG.defaultSchools.map(function(name) {
    return { school_id: mediaCatalogSchoolId_(name), school_name: name, active: 'TRUE' };
  });
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
