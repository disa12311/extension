# 🛡️ SecureGuard Pro - Browser Security Extension

Extension bảo mật toàn diện cho trình duyệt Chrome/Edge với giao diện hiện đại và tính năng mạnh mẽ.

## ✨ Tính Năng

### 🚫 Anti-Tracking
- Chặn Google Analytics, Facebook Pixel, và hơn 15+ tracking domains
- Xóa tracking cookies tự động
- Ngăn chặn tracking pixels ẩn

### 🦠 Chống Malware & Phishing
- Phát hiện trang web độc hại theo thời gian thực
- Cảnh báo phishing với nhiều chỉ số
- Kiểm tra URL đáng ngờ (TLD lạ, obfuscation)
- Chặn tải file nguy hiểm (.exe, .bat, .vbs, v.v.)

### 🔒 Force HTTPS
- Tự động nâng cấp HTTP lên HTTPS
- Cảnh báo form mật khẩu trên HTTP
- Phát hiện mixed content

### 🍪 Auto Cookie Cleaner
- Tự động xóa tracking cookies mỗi giờ
- Giữ lại cookies quan trọng
- Bảo vệ quyền riêng tư người dùng

### 🎯 Các Tính Năng Khác
- Chống clickjacking
- Phát hiện clipboard hijacking
- Cảnh báo auto-download
- Monitor hành vi đáng ngờ

## 📁 Cấu Trúc Files

```
secureguard-extension/
├── icons/
│   ├── icon16.png       # Icon 16x16
│   ├── icon48.png       # Icon 48x48
│   └── icon128.png      # Icon 128x128
├── manifest.json        # Cấu hình extension
├── popup.html          # Giao diện popup
├── popup.js            # Logic popup
├── background.js       # Service worker
├── content.js          # Content script
├── rules.json          # Declarative Net Request rules
├── warning.html        # Trang cảnh báo
└── README.md           # File này
```

## 🚀 Cài Đặt

### Bước 1: Tạo Icons
1. Mở file **icon-generator.html** trong trình duyệt
2. Click "Tải Tất Cả Icons"
3. Lưu 3 files: `icon16.png`, `icon48.png`, `icon128.png`

### Bước 2: Tạo Thư Mục Extension
```bash
mkdir secureguard-extension
cd secureguard-extension
mkdir icons
```

### Bước 3: Copy Files
1. Copy tất cả files code vào thư mục `secureguard-extension/`
2. Copy 3 icon files vào thư mục `icons/`

### Bước 4: Load Extension
1. Mở Chrome/Edge
2. Truy cập `chrome://extensions/` (hoặc `edge://extensions/`)
3. Bật "Developer mode" ở góc phải trên
4. Click "Load unpacked"
5. Chọn thư mục `secureguard-extension`
6. Done! 🎉

## 🎯 Cách Sử Dụng

### Giao Diện Chính
- **Toggle chính**: Bật/tắt toàn bộ bảo vệ
- **Thống kê**: Xem số tracker bị chặn và mối đe dọa phát hiện
- **Feature toggles**: Bật/tắt từng tính năng riêng biệt
- **Scan button**: Quét trang hiện tại

### Các Tính Năng Toggle
- 🚫 **Anti-Tracking**: Chặn tracking scripts
- 🦠 **Chặn Malware**: Ngăn chặn trang web độc hại
- 🎣 **Anti-Phishing**: Phát hiện phishing
- 🔒 **HTTPS Force**: Nâng cấp lên HTTPS
- 🍪 **Xóa Cookie Tự Động**: Xóa tracking cookies

## ⚙️ Manifest V3 Updates

Extension này sử dụng Manifest V3 với:
- ✅ **Declarative Net Request API** thay vì webRequest
- ✅ Service Worker thay vì background pages
- ✅ Không cần permission `webRequestBlocking`

### Rules.json
File `rules.json` chứa các quy tắc chặn:
- **Rule ID 1-10**: Chặn tracking domains
- **Rule ID 11**: Force HTTPS upgrade
- **Rule ID 12-15**: Chặn thêm ad networks

### Thêm Tracking Domains
Để thêm domain mới vào blacklist, edit `rules.json`:

```json
{
  "id": 16,
  "priority": 1,
  "action": {
    "type": "block"
  },
  "condition": {
    "urlFilter": "*your-domain.com*",
    "resourceTypes": ["script", "xmlhttprequest"]
  }
}
```

## 🛠️ Troubleshooting

### Lỗi: "You do not have permission to use blocking webRequest"
✅ **Đã fix**: Extension đã được cập nhật sử dụng Declarative Net Request API

### Extension không chặn trackers
1. Kiểm tra toggle "Anti-Tracking" đã bật
2. Reload trang web
3. Mở Console và kiểm tra logs

### Icons không hiển thị
1. Đảm bảo thư mục `icons/` tồn tại
2. Kiểm tra đường dẫn trong `manifest.json`
3. Reload extension

### Statistics không cập nhật
1. Mở Developer Tools → Console
2. Kiểm tra có lỗi không
3. Clear storage và reload extension

## 📊 Statistics

Extension tracking:
- **Blocked Count**: Số requests bị chặn
- **Threat Count**: Số mối đe dọa phát hiện

Stats được lưu trong `chrome.storage.local`

## 🔐 Permissions Explained

- `storage`: Lưu settings và statistics
- `tabs`: Truy cập thông tin tab
- `webNavigation`: Monitor navigation events
- `alarms`: Tự động xóa cookies theo lịch
- `notifications`: Hiển thị thông báo
- `declarativeNetRequest`: Chặn requests (Manifest V3)
- `cookies`: Xóa tracking cookies

## 🎨 Customization

### Thay Đổi Màu Sắc
Edit `popup.html`, tìm gradient:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Thêm Threat Domains
Edit `background.js`:
```javascript
const THREAT_DOMAINS = [
  'malware-test.com',
  'your-domain.com'  // Thêm domain mới
];
```

## 📝 To-Do List

- [ ] Thêm whitelist cho trusted domains
- [ ] Export/import settings
- [ ] Dark mode
- [ ] Detailed statistics dashboard
- [ ] Cloud sync settings
- [ ] Custom blocking rules UI

## 🤝 Contributing

Contributions welcome! Hãy:
1. Fork repo
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa

## 👨‍💻 Author

Được tạo với ❤️ cho cộng đồng developer Việt Nam

## 🌟 Support

Nếu thấy hữu ích, hãy:
- ⭐ Star project
- 🐛 Report bugs
- 💡 Suggest features
- 📢 Share với bạn bè

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Status**: ✅ Production Ready