/**
 * SUNBOT TEACHER ACADEMY - STA-008 PEER REVIEW HANDLER V01
 *
 * Mục tiêu:
 * - Nhận dữ liệu từ trang /training/peer-review-sta008.html.
 * - Ghi phản hồi peer review vào Google Sheet của tài khoản tuongvan1906@gmail.com.
 *
 * Sheet mặc định:
 * https://docs.google.com/spreadsheets/d/17e5GDDab096XZYXsI42_k17QbN0vwuK1j9x-WAVZq90/edit
 *
 * Cách tích hợp vào backend Teacher Academy hiện tại:
 * Trong doPost, sau khi parse payload/action, đặt trước nhánh Unknown action:
 *
 *   const peerReviewResult = handleTeacherPeerReviewAction_(action, payload);
 *   if (peerReviewResult) return jsonOutput_({ success: true, result: peerReviewResult });
 *
 * Nếu backend đang dùng json_ thay vì jsonOutput_, đổi helper return tương ứng.
 */

const STA008_PEER_REVIEW_CONFIG = {
  spreadsheetId: '17e5GDDab096XZYXsI42_k17QbN0vwuK1j9x-WAVZq90',
  sheetName: 'RESPONSES_RAW',
  header: [
    'submitted_at',
    'reviewer_name',
    'reviewer_role',
    'presenter_name',
    'presentation_title',
    'goal_clarity',
    'flow_clarity',
    'age_fit',
    'case_value',
    'teacher_facilitation',
    'evidence_quality',
    'transferability',
    'presentation_clarity',
    'total_score',
    'strongest_point',
    'improvement_point',
    'valuable_case',
    'transfer_suggestion',
    'memorable_sentence',
    'my_future_case',
    'ai_visual_need',
    'source_url'
  ]
};

function handleTeacherPeerReviewAction_(action, payload) {
  if (action !== 'submit_peer_review') return null;
  const data = payload && payload.data ? payload.data : {};
  return appendSta008PeerReview_(data);
}

function appendSta008PeerReview_(data) {
  const ss = SpreadsheetApp.openById(STA008_PEER_REVIEW_CONFIG.spreadsheetId);
  const sh = getOrCreateSta008PeerReviewSheet_(ss);
  const row = STA008_PEER_REVIEW_CONFIG.header.map(function(key) {
    if (key === 'submitted_at') return data.submitted_at || new Date();
    if (key === 'total_score') return Number(data.total_score || 0);
    return String(data[key] || '').trim();
  });
  sh.appendRow(row);
  return {
    message: 'Đã ghi phản hồi STA-008 Peer Review.',
    sheet: STA008_PEER_REVIEW_CONFIG.sheetName,
    total_score: Number(data.total_score || 0)
  };
}

function getOrCreateSta008PeerReviewSheet_(ss) {
  let sh = ss.getSheetByName(STA008_PEER_REVIEW_CONFIG.sheetName);
  if (!sh) {
    sh = ss.insertSheet(STA008_PEER_REVIEW_CONFIG.sheetName);
  }
  const currentHeader = sh.getRange(1, 1, 1, STA008_PEER_REVIEW_CONFIG.header.length).getValues()[0];
  const headerMissing = currentHeader.join('') === '' || currentHeader[0] !== STA008_PEER_REVIEW_CONFIG.header[0];
  if (headerMissing) {
    sh.getRange(1, 1, 1, STA008_PEER_REVIEW_CONFIG.header.length).setValues([STA008_PEER_REVIEW_CONFIG.header]);
    sh.setFrozenRows(1);
  }
  return sh;
}
