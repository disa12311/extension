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
- `INSTALL.md`

### 2.2 Source Files (src/)

Copy các files TypeScript vào `src/`:

- `src/types.ts`
- `src/background.ts`
- `src/popup.ts`
- `src/content.ts`

### 2.3 Icons

Tạo thư mục `icons/` và thêm 3 icons:

- `icons/icon16.png`
- `icons/icon48.png`
- `icons/icon128.png`

## 🔧 Step 3: Install Dependencies

```bash
# Install tất cả dependencies
npm install
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

## 🏗️ Step 4: Build Project

```bash
# Build TypeScript + Copy assets
npm run build
```

**Expected output:**
```
> secureguard-pro@1.0.0 build
> tsc && npm run copy-assets

✓ TypeScript compiled successfully

> secureguard-pro@1.0.0 copy-assets
> npm run copy-html && npm run copy-json && npm run copy-icons

✓ HTML files copied
✓ JSON files copied
✓ Icons copied
```

Sau khi build, cấu trúc `dist/` sẽ như sau:

```
dist/
├── types.js
├── types.js.map
├── background.js
├── background.js.map
├── popup.js
├── popup.js.map
├── content.js
├── content.js.map
├── popup.html           ✅ Copied from root
├── warning.html         ✅ Copied from root
├── rules.json          ✅ Copied from root
├── manifest.json       ✅ Copied from root
└── icons/              ✅ Copied from root
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 🗺️ Tại Sao Copy Assets?

- **HTML files**: Extension cần `popup.html` và `warning.html` để hiển thị UI
- **JSON files**: 
  - `rules.json` - Chứa rules chặn tracking
  - `manifest.json` - Chrome extension manifest
- **Icons**: Extension icons cho toolbar và settings

### Nếu Có Lỗi Build

#### Error: Cannot find module 'chrome'

```bash
npm install --save-dev @types/chrome
```

#### Error: cp command not found (Windows)

Nếu bạn dùng Windows, update `package.json`:

```json
"scripts": {
  "copy-html": "copy popup.html warning.html dist\\",
  "copy-json": "copy rules.json manifest.json dist\\",
  "copy-icons": "xcopy /E /I icons dist\\icons"
}
```

Hoặc cài `npm-run-all`:

```bash
npm install --save-dev npm-run-all
```

Rồi update scripts:

```json
"scripts": {
  "build": "tsc && npm-run-all copy-*",
  "copy-html": "cpy popup.html warning.html dist",
  "copy-json": "cpy rules.json manifest.json dist",
  "copy-icons": "cpy icons/** dist"
}
```

## 🌐 Step 5: Load Extension

### 5.1 Mở Chrome Extensions

1. Mở Chrome
2. Vào `chrome://extensions`
3. Bật **Developer mode** (toggle ở góc phải trên)

### 5.2 Load Unpacked Extension

1. Click **Load unpacked**
2. Navigate đến thư mục project root (chứa manifest.json)
3. Click **Select Folder**

**LÀM RÕ**: Load thư mục **ROOT** của project, KHÔNG phải thư mục `dist/`. Chrome sẽ tự động đọc `manifest.json` ở root và load files từ `dist/` theo đường dẫn trong manifest.

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

**Lưu ý**: Watch mode CHỈ compile TypeScript. Nếu bạn sửa `.html` hoặc `.json`, phải chạy:

```bash
npm run copy-assets
```

### Full Rebuild

```bash
npm run build
```

### Clean Build

```bash
npm run clean
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
# Verify manifest.json exists in ROOT (not dist)
ls -la manifest.json

# Check manifest is valid JSON
cat manifest.json | json_pp
```

### Issue 2: Files Not Found

**Symptoms**: "Could not load popup.html"

**Solution**:
```bash
# Rebuild and copy assets
npm run build

# Verify dist folder
ls -la dist/
# Should see: popup.html, warning.html, rules.json, etc.
```

### Issue 3: Icons Missing

**Symptoms**: Extension shows default icon

**Solution**:
```bash
# Check icons exist
ls -la icons/

# Copy icons manually if needed
npm run copy-icons

# Or rebuild
npm run build
```

### Issue 4: Changes Not Reflecting

**Symptoms**: Code changes don't appear

**Solution**:
1. Rebuild: `npm run build`
2. Go to `chrome://extensions`
3. Click **Reload** button on SecureGuard Pro
4. Hard refresh pages (Ctrl+Shift+R)

### Issue 5: Permission Denied (Windows)

**Symptoms**: Cannot copy files

**Solution**:
```bash
# Run as Administrator
# Or install cpy-cli
npm install --save-dev cpy-cli

# Update package.json scripts to use cpy
```

## 📊 Verify Everything Works

Run this checklist:

- [ ] `npm install` completed without errors
- [ ] `npm run build` creates dist/ folder with all files
- [ ] `dist/` contains: .js, .html, .json, icons/
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
4. Run `npm run build` sau mỗi thay đổi

### Prepare for Production

```bash
# Build optimized version
npm run build

# Test thoroughly
# Then package for Chrome Web Store

# Create zip (exclude source files)
zip -r secureguard-pro-v2.zip dist/ manifest.json icons/ rules.json popup.html warning.html -x "*.map"
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
3. ✅ `dist/` folder contains all necessary files
4. ✅ Extension appears trong chrome://extensions
5. ✅ Popup mở và hoạt động
6. ✅ Console log: "🛡️ SecureGuard Pro background service worker loaded"
7. ✅ Features hoạt động (tracking block, scan, etc.)

## 📁 Final Structure

```
secureguard-pro-typescript/
├── src/                    # TypeScript source
│   ├── types.ts
│   ├── background.ts
│   ├── popup.ts
│   └── content.ts
├── dist/                   # Built output (auto-generated)
│   ├── *.js               # Compiled JavaScript
│   ├── *.js.map           # Source maps
│   ├── *.html             # Copied HTML
│   ├── *.json             # Copied JSON
│   └── icons/             # Copied icons
├── icons/                  # Source icons
├── manifest.json          # Extension manifest (root)
├── popup.html             # Popup HTML (root)
├── warning.html           # Warning page (root)
├── rules.json             # Blocking rules (root)
├── package.json           # NPM config
├── tsconfig.json          # TypeScript config
└── README-TypeScript.md   # Documentation
```

---

🎉 **Congratulations!** Extension TypeScript đã sẵn sàng!

**What's Next?**
- Đọc code trong `src/` để hiểu architecture
- Try thêm features mới
- Deploy lên Chrome Web Store

**Happy Coding! 🚀**