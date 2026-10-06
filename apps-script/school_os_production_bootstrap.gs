/* Sunbot School OS - production bootstrap.
 * Uses the approved current database directly; does not import or merge old files.
 */
function schoolOsProductionBootstrap() {
  const spreadsheetId = '1alKUr9W3I-kKEyuTZOmDLCY8ZV1go49N0Q9HzpicnZI';
  const ss = SpreadsheetApp.openById(spreadsheetId);
  ['SO_SCHOOLS','SO_CONTACTS','SO_TASKS','SO_OPPORTUNITIES','SO_USERS'].forEach(function(name) {
    if (!ss.getSheetByName(name)) throw new Error('Thiếu bảng production: ' + name);
  });
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SCHOOL_OS_SPREADSHEET_ID', spreadsheetId);
  const result = schoolOsSetup();
  delete result.apiKey;
  result.environment = 'production';
  result.productionSpreadsheetId = spreadsheetId;
  result.productionSpreadsheetUrl = ss.getUrl();
  result.note = 'Dùng dữ liệu hiện tại đã duyệt; không nhập lại dữ liệu cũ.';
  return result;
}
