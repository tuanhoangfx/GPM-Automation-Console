- **Ngày/Giờ:** 2026-04-29 22:30 (UTC+7)
- **Tính năng:** Tự động cập nhật Version Log từ CHANGELOG
- **Trạng thái:** Tiếp tục làm dở dang
- **Mô tả ngắn gọn:** Cập nhật `src/App.tsx` để parse dữ liệu release từ `CHANGELOG.md` thay cho hard-code, thêm `src/raw-imports.d.ts` để hỗ trợ import `*.md?raw`, build kiểm tra thành công với `corepack pnpm build`.

- **Ngày/Giờ:** 2026-04-29 22:35 (UTC+7)
- **Tính năng:** Nâng phiên bản 0.1.3 và tự động hiển thị mọi cập nhật changelog
- **Trạng thái:** Tiếp tục làm dở dang
- **Mô tả ngắn gọn:** Cập nhật `package.json` lên `0.1.3`, thêm entry mới trong `CHANGELOG.md`, chỉnh `src/App.tsx` để Version Log parse mọi mục mới có `### Changes` (ưu tiên `- Version`, sau đó `Release`, fallback theo ngày), build kiểm tra thành công.

- **Ngày/Giờ:** 2026-04-29 22:36 (UTC+7)
- **Tính năng:** Hiển thị đồng thời Version và Timestamp trong Version Log
- **Trạng thái:** Tiếp tục làm dở dang
- **Mô tả ngắn gọn:** Cập nhật `src/App.tsx` để parse thêm trường `- Timestamp:` và render badge thời gian, cập nhật `src/styles.css` cho style timestamp badge, bổ sung timestamp cho entry `0.1.3` trong `CHANGELOG.md`, build kiểm tra thành công.
