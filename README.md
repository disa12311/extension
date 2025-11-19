# 🎥 YouTube Video Fix Pro Extension

Extension Chrome/Edge để fix lỗi phát video YouTube, cải thiện chất lượng và tối ưu trải nghiệm xem.

## ✨ Tính Năng

### 🎬 Chất Lượng Video
- ✅ Tự động chọn chất lượng cao nhất (4K/1080p/720p)
- ✅ Force codec VP9 cho chất lượng tốt hơn H264
- ✅ Tùy chỉnh chất lượng ưu tiên

### ⚡ Tối Ưu Phát Video
- ✅ Fix lỗi buffering/lag
- ✅ Fix lỗi video bị stall
- ✅ Tự động reload khi có lỗi
- ✅ Tối ưu buffer size
- ✅ Cải thiện hiệu suất phát video

### 🎯 Tính Năng Bổ Sung
- ✅ Tự động skip quảng cáo
- ✅ Điều khiển tốc độ nâng cao (Shift + </>, R)
- ✅ Theater mode tự động
- ✅ Tắt autoplay
- ✅ Mute quảng cáo tự động

## 📦 Cài Đặt Extension

### Bước 1: Tạo thư mục extension
```bash
mkdir youtube-video-fix
cd youtube-video-fix
```

### Bước 2: Tạo các file

Tạo các file sau trong thư mục:

1. **manifest.json** - File cấu hình chính
2. **content.js** - Script chạy trên YouTube
3. **popup.html** - Giao diện popup
4. **popup.js** - Logic popup
5. **background.js** - Service worker

### Bước 3: Tạo icon

Bạn cần tạo 3 icon với kích thước:
- icon16.png (16x16)
- icon48.png (48x48)  
- icon128.png (128x128)

Hoặc dùng icon mặc định bằng cách tải về từ [flaticon.com](https://www.flaticon.com/search?word=youtube) (free).

### Bước 4: Load extension vào Chrome/Edge

1. Mở Chrome/Edge
2. Vào `chrome://extensions/` (hoặc `edge://extensions/`)
3. Bật **Developer mode** (góc trên bên phải)
4. Click **Load unpacked**
5. Chọn thư mục `youtube-video-fix`
6. Done! ✅

## 🎮 Cách Sử Dụng

### Sau khi cài đặt:

1. **Mở YouTube** - Extension tự động hoạt động
2. **Click icon extension** để mở popup cài đặt
3. **Tùy chỉnh** các tính năng theo ý muốn
4. **Lưu cài đặt** và reload trang YouTube

### Phím tắt:

- **Shift + >** - Tăng tốc độ (+0.25x)
- **Shift + <** - Giảm tốc độ (-0.25x)
- **Shift + R** - Reset tốc độ về 1x

## 🔧 Cấu Hình

Các tùy chọn có thể bật/tắt:

| Tính năng | Mô tả | Mặc định |
|-----------|-------|----------|
| Auto Quality | Tự động chọn chất lượng cao | ✅ Bật |
| Force VP9 | Ép codec VP9 chất lượng cao | ✅ Bật |
| Buffer Fix | Fix lỗi buffering/lag | ✅ Bật |
| Speed Control | Phím tắt điều khiển tốc độ | ✅ Bật |
| Skip Ads | Tự động skip quảng cáo | ✅ Bật |
| Theater Mode | Force chế độ theater | ❌ Tắt |
| Disable Autoplay | Tắt tự động phát video tiếp | ❌ Tắt |

## 🐛 Debug & Troubleshooting

### Kiểm tra extension hoạt động:

1. Mở YouTube
2. Nhấn **F12** mở Console
3. Tìm message: `🎥 YouTube Video Fix Pro đã được kích hoạt!`

### Các vấn đề thường gặp:

**❌ Extension không hoạt động:**
- Kiểm tra extension đã được bật chưa
- Reload lại trang YouTube (F5)
- Reload extension: `chrome://extensions/` → Click reload

**❌ Không thay đổi được chất lượng:**
- Chờ video load 2-3 giây
- Kiểm tra video có hỗ trợ chất lượng đó không
- Thử force reload (Ctrl + Shift + R)

**❌ Quảng cáo vẫn chạy:**
- Extension chỉ skip được một số loại ads
- Một số ads mới không thể skip

## 📝 Lưu Ý

- Extension hoạt động tốt nhất trên **Chrome 88+** và **Edge 88+**
- Một số tính năng có thể không hoạt động với YouTube Premium
- Extension tự động reload các tab YouTube khi lưu cấu hình
- Dữ liệu cấu hình được sync qua Chrome/Edge account

## 🔐 Quyền Sử Dụng

Extension cần các quyền sau:

- `storage` - Lưu cấu hình
- `webRequest` - Tối ưu video requests
- `youtube.com` - Chạy script trên YouTube
- `googlevideo.com` - Tối ưu video CDN

## 🚀 Tính Năng Sắp Tới

- [ ] Tải video offline
- [ ] Picture-in-Picture nâng cao
- [ ] Playlist manager
- [ ] Video stats overlay
- [ ] Custom themes

## 📄 License

MIT License - Sử dụng tự do!

## 💬 Support

Có vấn đề? Tạo issue hoặc liên hệ qua:
- Email: support@example.com
- GitHub: [your-repo]

---

Made with ❤️ for YouTube lovers 🎬