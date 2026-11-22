/**
 * ============================================================================
 * BẾP XANH - BACKEND ĐÁM MÂY TRÊN GOOGLE SHEETS (Google Apps Script)
 * ============================================================================
 * HƯỚNG DẪN CÀI ĐẶT TRONG 2 PHÚT:
 * 1. Tạo 1 file Google Sheets mới trên Google Drive của bạn (Đặt tên: "Bếp Xanh Database").
 * 2. Trên thanh menu của Google Sheets, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa đoạn code mặc định trong file Code.gs và DÁN TOÀN BỘ nội dung file này vào.
 * 4. Bấm biểu tượng Đĩa mềm (Lưu), sau đó bấm nút "Triển khai" (Deploy) ở góc trên bên phải -> "Tùy chọn triển khai mới" (New deployment).
 * 5. Ở mục "Chọn loại" (hình bánh răng), chọn "Ứng dụng web" (Web app):
 *    - Thực thi dưới dạng (Execute as): Tôi (Me)
 *    - Ai có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 * 6. Bấm "Triển khai" (Deploy), cấp quyền truy cập và COPY đường link "URL ứng dụng web" (có đuôi .../exec).
 * 7. Mở trang Web Bếp Xanh -> Vào mục Quản lý (Admin) -> Dán đường link đó vào ô "Kết nối Cloud Database (Google Sheets / API)" -> Bấm Lưu!
 *    Ngay lập tức, mọi đơn hàng sinh viên đặt từ các điện thoại khác nhau và mọi thay đổi thực đơn/ảnh/BOM sẽ đồng bộ thời gian thực!
 */

const SHEET_STATE = 'BepXanh_Cloud_State';
const SHEET_ORDERS_LOG = 'Danh_Sach_Don_Hang';

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let stateSheet = ss.getSheetByName(SHEET_STATE);
    if (!stateSheet) {
      return jsonResponse({ status: 'EMPTY', message: 'Chưa có dữ liệu khởi tạo trên Sheet.' });
    }
    const rawJson = stateSheet.getRange('A1').getValue();
    if (!rawJson) {
      return jsonResponse({ status: 'EMPTY', message: 'Ô dữ liệu trống.' });
    }
    return jsonResponse({
      status: 'OK',
      updatedAt: stateSheet.getRange('B1').getValue(),
      data: JSON.parse(rawJson)
    });
  } catch (err) {
    return jsonResponse({ status: 'ERROR', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const payload = JSON.parse(e.postData.contents);

    // 1. Lưu toàn bộ trạng thái đồng bộ (Thực đơn, BOM, Đơn đặt trước) vào sheet BepXanh_Cloud_State
    let stateSheet = ss.getSheetByName(SHEET_STATE);
    if (!stateSheet) {
      stateSheet = ss.insertSheet(SHEET_STATE);
    }
    const nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
    stateSheet.getRange('A1').setValue(JSON.stringify(payload.data));
    stateSheet.getRange('B1').setValue(nowStr);

    // 2. Ghi bảng danh sách đơn hàng rõ ràng ra sheet Danh_Sach_Don_Hang để chủ quán dễ xem trực tiếp trên Excel/Sheets
    let orderSheet = ss.getSheetByName(SHEET_ORDERS_LOG);
    if (!orderSheet) {
      orderSheet = ss.insertSheet(SHEET_ORDERS_LOG);
    }
    orderSheet.clearContents();
    orderSheet.appendRow([
      'Mã Đơn',
      'Thời Gian Đặt',
      'Họ Tên Khách Hàng',
      'Số Điện Thoại',
      'Ca Ăn',
      'Điểm Tập Kết Trường ĐH',
      'Chi Tiết Món Ăn',
      'Tổng Thanh Toán (VNĐ)',
      'Hình Thức Thanh Toán'
    ]);

    const orders = (payload.data && payload.data.orders) || [];
    const dishes = (payload.data && payload.data.dishes) || [];
    const dishMap = {};
    dishes.forEach(d => { dishMap[d.id] = d.name; });

    orders.forEach(o => {
      const itemsText = (o.items || []).map(i => (dishMap[i.dishId] || i.dishId) + ' (x' + i.quantity + ')').join(', ');
      const total = (o.items || []).reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
      orderSheet.appendRow([
        o.id,
        o.createdAt,
        o.customerName,
        o.customerPhone,
        o.shiftId,
        o.hubId,
        itemsText,
        total,
        o.paymentMethod
      ]);
    });

    return jsonResponse({ status: 'OK', updatedAt: nowStr });
  } catch (err) {
    return jsonResponse({ status: 'ERROR', message: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
