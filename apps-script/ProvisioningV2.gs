/**
 * Sunbot Platform V2 provisioning helpers.
 *
 * Paste this file into the Training/Auth Apps Script backend, then route these
 * actions from the existing doPost dispatcher:
 *
 *   if (action === 'get_tenants_v2') return getTenantsV2_(payload, user);
 *   if (action === 'provision_tenant_v2') return provisionTenantV2_(payload, user);
 *
 * The existing backend must validate token before calling these helpers.
 */

var SUPER_ADMIN_CODE_V2 = '1906';

function getTenantsV2_(payload, user) {
  assertSuperAdminV2_(user);
  var sheet = getOrCreateSheetV2_('TENANTS', [
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
  ]);
  return {
    success: true,
    tenants: readObjectsV2_(sheet)
  };
}

function provisionTenantV2_(payload, user) {
  assertSuperAdminV2_(user);
  if (String(payload.super_code || '') !== SUPER_ADMIN_CODE_V2) {
    throw new Error('Ma xac nhan SUPER_ADMIN khong dung.');
  }

  var tenant = payload.tenant || {};
  var tenantId = cleanIdV2_(tenant.tenant_id);
  if (!tenantId) throw new Error('Thieu tenant_id.');
  if (!tenant.tenant_name) throw new Error('Thieu tenant_name.');

  var now = new Date().toISOString();
  var tenantsSheet = getOrCreateSheetV2_('TENANTS', [
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
  ]);

  upsertByKeyV2_(tenantsSheet, 'tenant_id', tenantId, {
    tenant_id: tenantId,
    tenant_name: tenant.tenant_name,
    tenant_type: tenant.tenant_type || 'SCHOOL',
    parent_tenant_id: tenant.parent_tenant_id || '',
    default_region: tenant.default_region || '',
    active_school_year_id: tenant.active_school_year_id || 'SY_2025_2026',
    backend_mode: tenant.backend_mode || 'SHARED',
    data_backend_url: tenant.data_backend_url || '',
    status: tenant.backend_mode === 'DEDICATED' && !tenant.data_backend_url ? 'NEEDS_BACKEND_URL' : 'ACTIVE',
    created_at: now,
    updated_at: now,
    updated_by: getUserIdV2_(user)
  }, { preserveCreatedAt: true });

  ensureSchoolYearV2_(tenant.active_school_year_id || 'SY_2025_2026', user);
  var adminCreated = maybeCreateTenantAdminV2_(payload.adminUser || {}, tenantId, user);
  writeAuditLogV2_(user, tenantId, 'provision_tenant_v2', 'TENANT', tenantId, payload, { adminCreated: adminCreated });

  return {
    success: true,
    tenant_id: tenantId,
    message: 'Da tao/cap nhat tenant ' + tenantId + '.',
    admin_created: adminCreated
  };
}

function ensureSchoolYearV2_(schoolYearId, user) {
  var id = cleanIdV2_(schoolYearId || 'SY_2025_2026');
  var sheet = getOrCreateSheetV2_('SCHOOL_YEARS', [
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
  var now = new Date().toISOString();
  upsertByKeyV2_(sheet, 'school_year_id', id, {
    school_year_id: id,
    name: id.replace(/^SY_/, '').replace('_', '-'),
    start_date: '',
    end_date: '',
    status: 'ACTIVE',
    sort_order: '',
    created_at: now,
    updated_at: now,
    updated_by: getUserIdV2_(user)
  }, { preserveCreatedAt: true });
}

function maybeCreateTenantAdminV2_(adminUser, tenantId, actor) {
  if (!adminUser || !adminUser.username) return false;
  var now = new Date().toISOString();
  var usersSheet = getOrCreateSheetV2_('USERS', [
    'user_id',
    'username',
    'password_or_pin',
    'display_name',
    'email',
    'primary_tenant_id',
    'status',
    'created_at',
    'updated_at'
  ]);
  var username = String(adminUser.username || '').trim();
  var userId = cleanIdV2_(username);
  upsertByKeyV2_(usersSheet, 'username', username, {
    user_id: userId,
    username: username,
    password_or_pin: adminUser.password || '',
    display_name: adminUser.display_name || username,
    email: username.indexOf('@') > -1 ? username : '',
    primary_tenant_id: tenantId,
    status: 'ACTIVE',
    created_at: now,
    updated_at: now
  }, { preserveCreatedAt: true });

  var accessSheet = getOrCreateSheetV2_('USER_TENANT_ACCESS', [
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
  upsertByKeyV2_(accessSheet, 'access_id', userId + '__' + tenantId, {
    access_id: userId + '__' + tenantId,
    user_id: userId,
    tenant_id: tenantId,
    role: adminUser.role || 'TENANT_ADMIN',
    region_scope: 'ALL',
    school_scope_json: '',
    class_scope_json: '',
    effective_from: now.slice(0, 10),
    effective_to: '',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now
  }, { preserveCreatedAt: true });
  return true;
}

function writeAuditLogV2_(user, tenantId, action, targetType, targetId, beforeData, afterData) {
  var sheet = getOrCreateSheetV2_('AUDIT_LOGS', [
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
    new Date().toISOString(),
    getUserIdV2_(user),
    getRoleV2_(user),
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

function assertSuperAdminV2_(user) {
  var role = getRoleV2_(user);
  if (['SUPER_ADMIN', 'ADMIN', 'CEO', 'STA_ADMIN'].indexOf(role) === -1) {
    throw new Error('Tai khoan khong co quyen SUPER_ADMIN.');
  }
}

function getRoleV2_(user) {
  return String((user && (user.PermissionGroupID || user.role_id || user.Role || user.role)) || '').toUpperCase();
}

function getUserIdV2_(user) {
  return String((user && (user.UserID || user.Username || user.username || user.Email || user.email)) || 'UNKNOWN');
}

function getOrCreateSheetV2_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  return sheet;
}

function readObjectsV2_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function(h) { return String(h || '').trim(); });
  return values.slice(1).filter(function(row) {
    return row.some(function(v) { return String(v || '').trim() !== ''; });
  }).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function upsertByKeyV2_(sheet, keyName, keyValue, obj, options) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function(h) { return String(h || '').trim(); });
  var keyIndex = headers.indexOf(keyName);
  if (keyIndex === -1) throw new Error('Khong thay cot khoa ' + keyName + ' trong sheet ' + sheet.getName());
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][keyIndex]) === String(keyValue)) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex > -1 && options && options.preserveCreatedAt) {
    var createdIndex = headers.indexOf('created_at');
    if (createdIndex > -1 && values[rowIndex - 1][createdIndex]) obj.created_at = values[rowIndex - 1][createdIndex];
  }
  var row = headers.map(function(h) { return obj[h] == null ? '' : obj[h]; });
  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);
}

function cleanIdV2_(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}
