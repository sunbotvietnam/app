/**
 * Sunbot Platform V2 provisioning.
 * Backend actions:
 * - get_tenants_v2
 * - provision_tenant_v2
 */

const SUPER_ADMIN_CODE_V2 = '1906';

function getTenantsV2_(payload, actor) {
  requireSuperAdminV2_(actor);
  const sheet = getOrCreateSheetWithHeadersV2_('TENANTS', tenantHeadersV2_());
  return {
    tenants: readObjectsFromSheetV2_(sheet)
  };
}

function provisionTenantV2_(payload, actor) {
  requireSuperAdminV2_(actor);
  if (safeString_(payload.super_code) !== SUPER_ADMIN_CODE_V2) {
    throw new Error('Mã xác nhận SUPER_ADMIN không đúng.');
  }

  const tenant = payload.tenant || {};
  const tenantId = cleanTenantIdV2_(tenant.tenant_id);
  const tenantName = safeString_(tenant.tenant_name);
  if (!tenantId) throw new Error('Thiếu tenant_id.');
  if (!tenantName) throw new Error('Thiếu tenant_name.');

  const now = now_();
  const status = safeString_(tenant.backend_mode) === 'DEDICATED' && !safeString_(tenant.data_backend_url)
    ? 'NEEDS_BACKEND_URL'
    : 'ACTIVE';

  const tenantsSheet = getOrCreateSheetWithHeadersV2_('TENANTS', tenantHeadersV2_());
  upsertObjectByKeyV2_(tenantsSheet, 'tenant_id', tenantId, {
    tenant_id: tenantId,
    tenant_name: tenantName,
    tenant_type: safeString_(tenant.tenant_type) || 'SCHOOL',
    parent_tenant_id: safeString_(tenant.parent_tenant_id),
    default_region: safeString_(tenant.default_region),
    active_school_year_id: cleanTenantIdV2_(tenant.active_school_year_id || 'SY_2025_2026'),
    backend_mode: safeString_(tenant.backend_mode) || 'SHARED',
    data_backend_url: safeString_(tenant.data_backend_url),
    status: status,
    created_at: now,
    updated_at: now,
    updated_by: actor.UserID || actor.Username || ''
  }, true);

  ensureSchoolYearV2_(tenant.active_school_year_id || 'SY_2025_2026', actor);
  ensurePermissionGroupV2_(safeString_((payload.adminUser || {}).role) || 'TENANT_ADMIN');
  const adminCreated = maybeCreateTenantAdminV2_(payload.adminUser || {}, tenantId, actor);
  writeAuditLogV2_(actor, tenantId, 'provision_tenant_v2', 'TENANT', tenantId, payload, {
    tenant_id: tenantId,
    status: status,
    admin_created: adminCreated
  });

  return {
    tenant_id: tenantId,
    message: 'Đã tạo/cập nhật tenant ' + tenantId + '.',
    status: status,
    admin_created: adminCreated
  };
}

function tenantHeadersV2_() {
  return [
    'tenant_id',
    'tenant_name',
    'tenant_type',
    'parent_tenant_id',
    'default_region',
    'active_school_year_id',
    'backend_mode',
    'data_backend_url',
    'status',
    'created_at',
    'updated_at',
    'updated_by'
  ];
}

function ensureSchoolYearV2_(schoolYearId, actor) {
  const id = cleanTenantIdV2_(schoolYearId || 'SY_2025_2026');
  const sheet = getOrCreateSheetWithHeadersV2_('SCHOOL_YEARS', [
    'school_year_id',
    'name',
    'start_date',
    'end_date',
    'status',
    'sort_order',
    'created_at',
    'updated_at',
    'updated_by'
  ]);
  upsertObjectByKeyV2_(sheet, 'school_year_id', id, {
    school_year_id: id,
    name: id.replace(/^SY_/, '').replace('_', '-'),
    start_date: '',
    end_date: '',
    status: 'ACTIVE',
    sort_order: '',
    created_at: now_(),
    updated_at: now_(),
    updated_by: actor.UserID || actor.Username || ''
  }, true);
}

function maybeCreateTenantAdminV2_(adminUser, tenantId, actor) {
  const username = safeString_(adminUser.username);
  if (!username) return false;
  const pin = safeString_(adminUser.password) || CONFIG.DEFAULT_PASSWORD;
  const role = safeString_(adminUser.role) || 'TENANT_ADMIN';
  const displayName = safeString_(adminUser.display_name) || username;
  const existing = getRowsAsObjects_(CONFIG.SHEETS.USERS);
  let user = existing.find(function(row) {
    return safeString_(row.Username).toLowerCase() === username.toLowerCase() ||
      safeString_(row.Email).toLowerCase() === username.toLowerCase();
  });

  if (!user) {
    const userId = generateId_('User');
    user = {
      UserID: userId,
      FullName: displayName,
      Username: username,
      PasswordHash: hashPassword_(pin),
      Email: username.indexOf('@') !== -1 ? username : '',
      Phone: '',
      Role: role,
      PermissionGroupID: role,
      Team: tenantId,
      Status: CONFIG.STATUS.ACTIVE,
      Score: 0,
      LastLogin: '',
      Avatar: '',
      Notes: 'Tenant admin V2: ' + tenantId,
      CreatedAt: now_(),
      UpdatedAt: now_()
    };
    appendObject_(CONFIG.SHEETS.USERS, user);
    appendQuanLyTaiKhoanIfExistsV2_(user, pin, role);
  } else {
    updateObjectByKey_(CONFIG.SHEETS.USERS, 'UserID', user.UserID, {
      Role: role,
      PermissionGroupID: role,
      Team: tenantId,
      UpdatedAt: now_()
    });
  }

  const accessSheet = getOrCreateSheetWithHeadersV2_('USER_TENANT_ACCESS', [
    'access_id',
    'user_id',
    'tenant_id',
    'role',
    'region_scope',
    'school_scope_json',
    'class_scope_json',
    'effective_from',
    'effective_to',
    'status',
    'created_at',
    'updated_at'
  ]);
  upsertObjectByKeyV2_(accessSheet, 'access_id', user.UserID + '__' + tenantId, {
    access_id: user.UserID + '__' + tenantId,
    user_id: user.UserID,
    tenant_id: tenantId,
    role: role,
    region_scope: 'ALL',
    school_scope_json: '',
    class_scope_json: '',
    effective_from: Utilities.formatDate(now_(), CONFIG.TIMEZONE, 'yyyy-MM-dd'),
    effective_to: '',
    status: 'ACTIVE',
    created_at: now_(),
    updated_at: now_()
  }, true);
  return true;
}

function ensurePermissionGroupV2_(permissionGroupId) {
  const id = safeString_(permissionGroupId);
  if (!id) return;
  const sheet = getSheet_(CONFIG.SHEETS.PERMISSIONS);
  const existing = getRowsAsObjects_(CONFIG.SHEETS.PERMISSIONS).some(function(row) {
    return safeString_(row.PermissionGroupID) === id;
  });
  if (existing) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(normalizeHeader_);
  const obj = {};
  headers.forEach(function(h) { obj[h] = ''; });
  obj.PermissionGroupID = id;
  obj.PermissionGroupName = id;
  obj.CanViewInternal = true;
  obj.CanExportData = id === 'TENANT_ADMIN';
  obj.CanManageUsers = false;
  appendObject_(CONFIG.SHEETS.PERMISSIONS, obj);
}

function appendQuanLyTaiKhoanIfExistsV2_(userRow, pin, userType) {
  if (!getDb_().getSheetByName('QUAN_LY_TAI_KHOAN')) return;
  appendObject_('QUAN_LY_TAI_KHOAN', {
    UserID: userRow.UserID,
    'Họ tên': userRow.FullName,
    'Email/ID đăng nhập': userRow.Username,
    'Mã PIN': pin,
    'Vai trò dễ hiểu': userRow.Role,
    'Mã nhóm quyền': userRow.PermissionGroupID,
    'Nhóm người dùng': userType || '',
    'Team/Kênh': userRow.Team,
    'Trạng thái': userRow.Status,
    'Ghi chú': userRow.Notes,
    'Lần đăng nhập cuối': '',
    SyncStatus: 'Đã đồng bộ',
    'Cập nhật lúc': now_()
  });
}

function writeAuditLogV2_(actor, tenantId, action, targetType, targetId, beforeData, afterData) {
  const sheet = getOrCreateSheetWithHeadersV2_('AUDIT_LOGS', [
    'log_id',
    'timestamp',
    'actor_user_id',
    'actor_role',
    'tenant_id',
    'action',
    'target_type',
    'target_id',
    'before_json',
    'after_json',
    'requires_super_code',
    'result'
  ]);
  sheet.appendRow([
    'AUD_' + Date.now(),
    now_(),
    actor.UserID || actor.Username || '',
    actor.PermissionGroupID || actor.Role || '',
    tenantId,
    action,
    targetType,
    targetId,
    JSON.stringify(beforeData || {}),
    JSON.stringify(afterData || {}),
    'TRUE',
    'SUCCESS'
  ]);
}

function requireSuperAdminV2_(actor) {
  const role = safeString_(actor.PermissionGroupID || actor.Role).toUpperCase();
  const permissions = getPermissionForUser_(actor);
  if (role === 'SUPER_ADMIN' || role === 'CEO_FULL' || role === 'ADMIN' || role === 'STA_ADMIN' || permissions.CanManageUsers) {
    return true;
  }
  throw new Error('Tài khoản không có quyền SUPER_ADMIN.');
}

function getOrCreateSheetWithHeadersV2_(sheetName, headers) {
  const ss = getDb_();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(normalizeHeader_);
  const missing = headers.filter(function(h) { return current.indexOf(h) === -1; });
  if (missing.length) {
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

function readObjectsFromSheetV2_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(normalizeHeader_);
  return values.slice(1).filter(function(row) {
    return row.some(function(cell) { return cell !== '' && cell !== null && cell !== undefined; });
  }).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function upsertObjectByKeyV2_(sheet, keyField, keyValue, obj, preserveCreatedAt) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(normalizeHeader_);
  const keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) throw new Error('Không tìm thấy cột key: ' + keyField);
  let rowNumber = -1;
  for (let r = 1; r < values.length; r++) {
    if (safeString_(values[r][keyIndex]) === safeString_(keyValue)) {
      rowNumber = r + 1;
      break;
    }
  }
  if (rowNumber > -1 && preserveCreatedAt) {
    const idx = headers.indexOf('created_at');
    if (idx > -1 && values[rowNumber - 1][idx]) obj.created_at = values[rowNumber - 1][idx];
  }
  const row = headers.map(function(header) {
    return obj[header] !== undefined ? obj[header] : '';
  });
  if (rowNumber > -1) sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);
}

function cleanTenantIdV2_(value) {
  return safeString_(value).toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}
