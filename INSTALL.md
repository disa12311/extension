# 📦 SecureGuard Pro - TypeScript Installation Guide

Hướng dẫn chi tiết từng bước để cài đặt và chạy extension TypeScript.

## 🎯 Prerequisites

Trước khi bắt đầu, bạn cần:

- ✅ **Node.js** (v16 trở lên) - [Download](https://nodejs.org/)
- ✅ **npm** (đi kèm với Node.js)
- ✅ **Chrome** hoặc **Edge** browser
- ✅ Code editor (VS Code khuyến nghị)

### Kiểm Tra Node.js & npm

```bash
node --version   # Should show v16.x.x or higher
npm --version    # Should show 8.x.x or higher
```

## 📥 Step 1: Tạo Project Structure

```bash
# Tạo thư mục project
mkdir secureguard-pro-typescript
cd secureguard-pro-typescript

# Tạo cấu trúc thư mục
mkdir src
mkdir dist
mkdir icons
```

## 📝 Step 2: Copy Files

### 2.1 Root Files

Copy các files sau vào root directory:

- `package.json`
- `tsconfig.json`
- `.eslintrc.json`
- `.prettierrc.json`
- `.gitignore`
- `manifest.json`
- `popup.html`
- `warning.html`
- `rules.json`
- `README-TypeScript.md`

### 2.2 Source Files (src/)

Copy các files TypeScript vào `src/`:

- `src/types.ts`
- `src/background.ts`
- `src/popup.ts`
- `src/content.ts`

### 2.3 Icons

Sử dụng icon generator để tạo 3 icons:

- `icons/icon16.png`
- `icons/icon48.png`
- `icons/icon128.png`

## 🔧 Step 3: Install Dependencies

```bash
# Install tất cả dependencies
npm install

# Hoặc nếu dùng yarn
yarn install
```

Quá trình này sẽ cài:
- TypeScript compiler
- Chrome types
- ESLint & Prettier
- TypeScript ESLint plugin

**Expected output:**
```
added 150 packages in 15s
```

## 🏗️ Step 4: Build TypeScript

```bash
# Build lần đầu
npm run build
```

**Expected output:**
```
> secureguard-pro@1.0.0 build
> tsc

✓ Successfully compiled TypeScript
```

Sau khi build, bạn sẽ thấy:
```
dist/
├── types.js
├── types.js.map          ✅ Source map for debugging
├── background.js
├── background.js.map     ✅ Source map for debugging
├── popup.js
├── popup.js.map          ✅ Source map for debugging
├── content.js
└── content.js.map        ✅ Source map for debugging
```

### 🗺️ Source Maps
Files `.map` giúp debug TypeScript trực tiếp trong Chrome DevTools:
- **Breakpoints**: Set trong `.ts` files thay vì `.js`
- **Stack traces**: Hiển thị line numbers từ TypeScript
- **Sources tab**: View original TypeScript code
- **No performance impact**: Chỉ load khi DevTools mở

### Nếu Có Lỗi Build

#### Error: Cannot find module 'chrome'

```bash
npm install --save-dev @types/chrome
```

#### Error: Cannot find module './types'

- Đảm bảo `types.ts` có trong `src/`
- Chạy lại `npm run build`

#### Error: TS2304: Cannot find name

- Kiểm tra `tsconfig.json` có đúng
- Verify `"lib": ["ES2020", "DOM"]` trong tsconfig

## 🌐 Step 5: Load Extension

### 5.1 Mở Chrome Extensions

1. Mở Chrome
2. Vào `chrome://extensions`
3. Bật **Developer mode** (toggle ở góc phải trên)

### 5.2 Load Unpacked Extension

1. Click **Load unpacked**
2. Navigate đến thư mục project root
3. Click **Select Folder**

### 5.3 Verify Installation

Extension sẽ xuất hiện với:
- ✅ Icon màu xanh đậm
- ✅ Tên: "SecureGuard Pro"
- ✅ Version: 2.0.0
- ✅ Badge "TS" trên popup

## 🧪 Step 6: Test Extension

### Test 1: Popup

1. Click icon extension trên toolbar
2. Popup sẽ mở với badge "TS"
3. Verify tất cả toggles hoạt động

### Test 2: Statistics

1. Visit `https://google.com`
2. Mở popup
3. "Chặn Tracker" count sẽ tăng

### Test 3: Real-time Protection

Visit URL test:
```
http://192.168.1.1
```
Kết quả: Badge ⚠️ xuất hiện + notification

### Test 4: Page Scanner

1. Mở bất kỳ trang web nào
2. Click "Quét Trang Hiện Tại"
3. Notification hiển thị kết quả

## 🔄 Step 7: Development Workflow

### Watch Mode (Khuyến nghị)

```bash
npm run watch
```

Giờ TypeScript sẽ tự động compile khi bạn save files!

**Workflow:**
1. Edit `src/background.ts`
2. Save (Ctrl+S)
3. TypeScript auto-compile
4. Reload extension trong Chrome
5. Test changes

### Manual Build

```bash
npm run build
```

### Code Quality

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run format
```

## 🐛 Common Issues & Solutions

### Issue 1: Extension Not Loading

**Symptoms**: Error "Manifest file is missing or unreadable"

**Solution**:
```bash
# Verify manifest.json exists in root
ls -la manifest.json

# Check manifest is valid JSON
cat manifest.json | json_pp
```

### Issue 2: Service Worker Error

**Symptoms**: "Service worker registration failed"

**Solution**:
```bash
# Rebuild TypeScript
npm run clean
npm run build

# Reload extension
```

### Issue 3: Module Not Found

**Symptoms**: "Cannot find module './types'"

**Solution**:
```bash
# Check imports use correct path
# In background.ts:
import type { ... } from './types';  # ✅ Correct

# Rebuild
npm run build
```

### Issue 4: Permission Denied

**Symptoms**: Cannot read property 'downloads'

**Solution**:
- Check `manifest.json` has `downloads` permission
- Reload extension

### Issue 5: Types Not Working

**Symptoms**: No autocomplete in VS Code

**Solution**:
```bash
# Install Chrome types
npm install --save-dev @types/chrome

# Restart VS Code
# Cmd+Shift+P → "Reload Window"
```

## 📊 Verify Everything Works

Run this checklist:

- [ ] `npm install` completed without errors
- [ ] `npm run build` creates dist/ folder
- [ ] Extension loads in Chrome without errors
- [ ] Popup opens and shows UI
- [ ] Can toggle features on/off
- [ ] Statistics count increases when browsing
- [ ] Real-time protection shows badges
- [ ] Scan button works
- [ ] Console shows: "🛡️ SecureGuard Pro background service worker loaded"

## 🎓 Next Steps

### Learn TypeScript

1. Read `README-TypeScript.md`
2. Check `src/types.ts` để hiểu type system
3. Experiment với code trong watch mode

### Customize Extension

1. Edit `src/background.ts` để thêm features
2. Update `src/types.ts` nếu cần types mới
3. Modify `popup.html` cho UI changes

### Prepare for Production

```bash
# Build optimized version
npm run build

# Zip for Chrome Web Store
zip -r secureguard-pro-v2.zip . -x "node_modules/*" -x "src/*" -x ".git/*"
```

## 📞 Need Help?

### Check Logs

**Background Worker:**
1. Right-click extension icon
2. "Manage Extension"
3. "Inspect views: service worker"
4. Check Console tab
5. **Sources tab**: Bạn sẽ thấy `src/` folder với TypeScript files! 🎉

**Popup:**
1. Right-click popup
2. "Inspect"
3. Check Console tab
4. **Sources tab**: Debug TypeScript code trực tiếp

### Debugging với Source Maps

**Set Breakpoint trong TypeScript:**
1. Open DevTools (F12)
2. Sources tab → `src/background.ts`
3. Click line number để set breakpoint
4. Breakpoint sẽ work trên TypeScript code!

**View Stack Trace:**
- Errors sẽ hiển thị: `background.ts:123` (TypeScript line)
- Không phải: `background.js:456` (JavaScript line)

### Common Commands

```bash
# Clean build
npm run clean && npm run build

# Fresh install
rm -rf node_modules package-lock.json
npm install

# Check TypeScript version
npx tsc --version

# Check for type errors without building
npx tsc --noEmit

# Build without source maps (production)
npx tsc --sourceMap false
```

## ✅ Success Indicators

Bạn đã cài đặt thành công nếu:

1. ✅ No errors trong `npm install`
2. ✅ No errors trong `npm run build`
3. ✅ Extension appears trong chrome://extensions
4. ✅ Popup mở và hoạt động
5. ✅ Console log: "🛡️ SecureGuard Pro background service worker loaded"
6. ✅ Features hoạt động (tracking block, scan, etc.)

---

🎉 **Congratulations!** Extension TypeScript đã sẵn sàng!

**What's Next?**
- Đọc code trong `src/` để hiểu architecture
- Try thêm features mới
- Deploy lên Chrome Web Store

**Happy Coding! 🚀**