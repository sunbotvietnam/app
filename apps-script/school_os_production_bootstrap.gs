/* Sunbot School OS - production bootstrap */

function schoolOsProductionBootstrap() {
  const spreadsheetId = '1EB-nbVGV38tfYRRla2t_9FmGP51UZo7dbkC_sOSXb-A';
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SCHOOL_OS_SPREADSHEET_ID', spreadsheetId);
  const result = schoolOsSetup();
  result.environment = 'production';
  result.productionSpreadsheetId = spreadsheetId;
  return result;
}
