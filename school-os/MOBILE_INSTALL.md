# Sunbot – Phát triển trường | Cài trên điện thoại

Ứng dụng School OS được triển khai dưới dạng **PWA (Progressive Web App)**. Người dùng có thể cài icon lên màn hình điện thoại và mở ở chế độ standalone như một ứng dụng, trong khi dữ liệu và phiên bản mới vẫn được cập nhật trực tiếp từ hệ thống production.

## Đường dẫn cài đặt

https://sunbotvietnam.github.io/app/school-os/

## Android – Chrome

1. Mở đường dẫn trên bằng Google Chrome.
2. Đăng nhập School OS.
3. Nếu nút **Cài ứng dụng** xuất hiện trên thanh trên cùng, bấm nút đó và xác nhận.
4. Nếu không thấy nút: mở menu `⋮` của Chrome → chọn **Cài đặt ứng dụng** hoặc **Thêm vào màn hình chính**.
5. Icon **Sunbot School** sẽ xuất hiện trên màn hình điện thoại.

## iPhone / iPad – Safari

1. Mở đường dẫn trên bằng Safari.
2. Bấm nút **Cài ứng dụng** trong School OS để xem hướng dẫn, hoặc bấm nút **Chia sẻ** của Safari.
3. Chọn **Thêm vào Màn hình chính (Add to Home Screen)**.
4. Giữ tên `Sunbot School` hoặc đổi tên nếu cần, sau đó bấm **Thêm**.
5. Mở ứng dụng từ icon ngoài màn hình.

> iOS không sử dụng cơ chế `beforeinstallprompt` như Chrome Android; thao tác Add to Home Screen là cơ chế chuẩn của Safari.

## Cập nhật ứng dụng

- Không cần cài lại khi School OS có phiên bản mới.
- Service worker sử dụng chiến lược **network-first**: khi có mạng, app ưu tiên lấy mã mới từ GitHub Pages; cache chỉ dùng làm phương án dự phòng.
- Khi phát hiện service worker mới, app kích hoạt bản mới và người dùng nhận phiên bản mới ở lần mở tiếp theo.

## Các file PWA production

- `manifest.webmanifest` – tên app, start URL, scope, chế độ standalone và icon.
- `service-worker.js` – cài đặt, cache dự phòng và cơ chế cập nhật.
- `pwa-runtime.js` – đăng ký service worker, nút Cài ứng dụng, hướng dẫn iOS và thông báo cập nhật.
- `icon.svg` – icon chuẩn.
- `icon-maskable.svg` – icon an toàn cho Android adaptive/maskable icon.
- `v3-runtime.html` – production entrypoint, đã nạp manifest và PWA runtime.

## Nguyên tắc vận hành

- Không phát hành một APK thủ công cho mỗi phiên bản School OS nếu không có nhu cầu đặc biệt.
- Nếu sau này cần Google Play, có thể đóng PWA hiện tại thành Trusted Web Activity (TWA) / Android package mà không thay backend hay URL production.
- Nếu cần App Store iOS chính thức, phải có Apple Developer account và quy trình ký/phát hành riêng; PWA hiện tại không cần quy trình này.

## Kiểm tra sau cài

1. Icon mở app không hiện thanh địa chỉ trình duyệt ở chế độ standalone.
2. Đăng nhập được bằng đúng tài khoản School OS.
3. Mở danh sách trường và drawer hồ sơ bình thường.
4. Tạo email/E-profile hoạt động.
5. Đóng app, mở lại và xác nhận phiên đăng nhập/luồng tải app hoạt động theo chính sách hiện hành.
