# 🌿 HƯỚNG DẪN XUẤT BẢN WEB BẾP XANH LÊN MẠNG CÔNG KHAI & ĐỒNG BỘ DỮ LIỆU THẬT

Tất cả các file mã nguồn của hệ thống **Bếp Xanh** đã được đóng gói sẵn trong thư mục Google Drive này của bạn, bao gồm:
1. `Bep_Xanh_Deploy_Netlify_Vercel.zip`: Gói cài đặt chuẩn để kéo-thả lên mạng công khai (chứa `index.html`, `index.css`, `app.js`).
2. `index.html`, `index.css`, `app.js`: Bộ 3 file mã nguồn gốc.
3. `Google_Apps_Script_Backend.js`: Mã nguồn kết nối cơ sở dữ liệu đám mây miễn phí trên **Google Sheets** để sinh viên đặt đơn từ nhiều điện thoại khác nhau đồng bộ trực tiếp về máy Quản lý.

---

## BƯỚC 1: Đưa trang web lên mạng công khai (Mất 30 giây - Hoàn toàn miễn phí)

### Cách A: Dùng Netlify Drop (Nhanh nhất - Kéo thả không cần cài đặt)
1. Tải file **`Bep_Xanh_Deploy_Netlify_Vercel.zip`** từ thư mục Google Drive này về máy tính của bạn (hoặc tải 3 file `index.html`, `index.css`, `app.js` bỏ vào 1 thư mục tên là `bep-xanh`).
2. Mở trình duyệt truy cập: **[https://app.netlify.com/drop](https://app.netlify.com/drop)** (đăng nhập nhanh bằng tài khoản Google/Email).
3. **Kéo và thả** file `.zip` (hoặc thư mục chứa 3 file) vào vòng tròn tải lên trên màn hình.
4. Sau 5 giây, Netlify sẽ cung cấp cho bạn một đường link công khai dạng: `https://bep-xanh-....netlify.app`.
   - Bạn có thể vào **Site configuration -> Change site name** để đổi thành `https://bep-xanh-dai-hoc.netlify.app` hoặc gắn tên miền `.vn` / `.com` của riêng bạn.

### Cách B: Dùng Tiiny.host hoặc Vercel
- Truy cập **[https://tiiny.host](https://tiiny.host)**, kéo file `Bep_Xanh_Deploy_Netlify_Vercel.zip` vào, nhập tên miền phụ mong muốn (ví dụ `bep-xanh`) và bấm **Publish**.

---

## BƯỚC 2: Kích hoạt Cơ sở dữ liệu Đám mây trên Google Sheets (Để khách đặt đơn từ nhiều điện thoại khác nhau)

Khi trang web đã có link công khai, để mọi đơn hàng của sinh viên đặt từ điện thoại cá nhân đều đổ về máy của Người quản lý (và khi Quản lý sửa ảnh/giá món ăn thì mọi điện thoại khách hàng đều tự cập nhật):

1. Mở Google Drive của bạn, bấm **Mới (New) -> Google Trang tính (Google Sheets)** và đặt tên file là: `Bếp Xanh Database`.
2. Trên thanh menu của file Google Sheets vừa tạo, chọn: **Tiện ích mở rộng (Extensions) -> Apps Script**.
3. Mở file **`Google_Apps_Script_Backend.js`** trong thư mục Drive này, copy toàn bộ nội dung và dán đè vào khung `Code.gs` của Apps Script, sau đó bấm `Ctrl + S` (Lưu).
4. Ở góc trên bên phải màn hình Apps Script, bấm nút **Triển khai (Deploy) -> Tùy chọn triển khai mới (New deployment)**:
   - Bấm vào biểu tượng bánh răng `⚙️` bên cạnh "Chọn loại" -> chọn **Ứng dụng web (Web app)**.
   - **Thực thi dưới dạng (Execute as):** Chọn **`Tôi (Me)`**.
   - **Ai có quyền truy cập (Who has access):** Chọn **`Bất kỳ ai (Anyone)`**.
   - Bấm **Triển khai (Deploy)** -> Cấp quyền truy cập tài khoản Google của bạn.
5. Copy đường link **URL ứng dụng web** (có dạng `https://script.google.com/macros/s/....../exec`).
6. Mở trang web **Bếp Xanh** của bạn -> Chuyển sang tab **`📊 Quản lý Bếp & Điều phối (Admin)`** -> Dán đường link vừa copy vào ô **`☁️ Kết nối Cơ sở dữ liệu Đám mây (Google Sheets Web App URL)`** -> Bấm **`🔗 Lưu & Kết nối`**.

Ngay sau khi kết nối:
- File Google Sheets của bạn sẽ tự động sinh ra bảng **`Danh_Sach_Don_Hang`** ghi lại rõ ràng từng đơn hàng (Mã đơn, Giờ đặt, Họ tên sinh viên/giảng viên, SĐT, Ca ăn, Điểm tập kết trường ĐH, Món ăn, Tổng tiền).
- Trang Quản lý trên web cũng tự động đồng bộ toàn bộ đơn đặt trước để tính **Định mức BOM**, **Phiếu dự trù nguyên vật liệu cần mua (Auto-MRP)**, **Lịch nấu Just-in-Time** và **Gộp đơn theo điểm tập kết trường Đại học**.
