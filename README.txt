SUNBOT GIÁO VIÊN - GÓI GITHUB TỐI GIẢN

File trong gói:
- index.html: app báo cáo ca học hiện tại, đã thêm manifest/icon để cài ra màn hình điện thoại.
- manifest.webmanifest: cấu hình app khi cài trên điện thoại.
- icon.svg: icon placeholder, có thể thay bằng logo Sunbot thật.
- icon-180.png / icon-192.png / icon-512.png: icon placeholder, nên thay bằng logo Sunbot thật cùng tên file.

Cách dùng:
1. Giải nén zip.
2. Upload toàn bộ file lên repo GitHub đang chứa app báo cáo ca học.
3. Đảm bảo index.html, manifest.webmanifest và các icon nằm cùng cấp.
4. Commit changes.
5. Mở link GitHub Pages trên điện thoại.
6. iPhone: Safari → Share → Add to Home Screen.
7. Android: Chrome → Add to Home screen.

Thay icon:
- Chỉ cần thay các file icon.svg, icon-180.png, icon-192.png, icon-512.png bằng logo thật của Sunbot.
- Giữ nguyên tên file để khỏi sửa code.

Ghi chú:
- Đây là app báo cáo ca học/cổng giáo viên. Trong app đã có nút đi sang app Đánh giá cuối năm.
- Không có sw.js để tránh cache phức tạp. Khi update index.html, GitHub Pages sẽ cập nhật đơn giản hơn.
