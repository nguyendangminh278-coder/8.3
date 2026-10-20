# University Wrapped 20/10 — Mobile Web

Website mobile chuyển từ Canva `WRAPPED 20/10` sang trải nghiệm dạng story, giữ nguyên artwork gốc và làm lại chuyển cảnh để trông tự nhiên hơn trên điện thoại.

## Nguồn thiết kế

- Canva design: `DAHYdLjF2Pw`
- Kích thước gốc: `900 × 1600` (9:16)
- Website dùng 14 trang có nội dung; trang 15 trên Canva hiện đang trống.

## Trải nghiệm mobile

- Vuốt lên/xuống để chuyển trang.
- Chạm bên phải để đi tiếp, bên trái để quay lại.
- Có drag feedback, vibration nhẹ trên thiết bị hỗ trợ, progress bar, safe-area cho iPhone và reduced-motion.
- Mỗi nhóm nội dung có transition riêng: timeline, zoom, ranking shutter, diagonal wipe, paper turn, flash, spotlight, photo depth, camera push, split và finale.
- Một số section còn được cắt thành các lát của chính artwork Canva trong lúc chuyển cảnh để tạo cảm giác từng layer đang chuyển động mà không làm sai bố cục gốc.

## Cách website giữ nguyên Canva

Website ưu tiên theo thứ tự:

1. `assets/pages/01.webp` → `14.webp`: ảnh của từng page lấy trực tiếp từ Canva và lưu bền vững trong repo.
2. Nếu ảnh local không tồn tại, fallback sang Canva Embed.

Canva hiện trả page preview ở `335 × 596`; workflow upscale bằng Lanczos lên `900 × 1600` và lưu WebP chất lượng cao. Đây là cách giữ nguyên toàn bộ bố cục, typography, sticker và ảnh của Canva mà không phụ thuộc vào link ảnh có thời hạn.

## Đồng bộ page từ Canva

Repo có workflow:

```text
.github/workflows/snapshot-canva.yml
```

Các file nguồn:

```text
scripts/canva-page-sources.json
scripts/fetch-canva-pages.mjs
```

Workflow tải trực tiếp page preview đã ký của Canva, kiểm tra kích thước và độ khác biệt giữa các trang, upscale sang WebP `900 × 1600`, rồi commit vào `assets/pages/`.

Khi Canva thay đổi, cập nhật lại `scripts/canva-page-sources.json` bằng page preview mới rồi chạy:

```text
Actions → Snapshot Canva pages → Run workflow
```

## Chạy local

```bash
python -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

## GitHub Pages

Repo đã có `.github/workflows/pages.yml`. Cần bật GitHub Pages một lần trong `Settings → Pages`, sau đó có thể chạy workflow deploy thủ công.

## File chính

- `index.html` — khung story mobile.
- `styles.css` — responsive, swipe feedback và transition riêng từng section.
- `app.js` — page config, local snapshot priority, Canva fallback, tap/swipe/keyboard.
- `effects.js` — hiệu ứng cắt artwork thành các lát/layer trong lúc transition.
- `scripts/fetch-canva-pages.mjs` — lấy page Canva và tạo WebP local.
- `assets/pages/` — 14 artwork page thực tế dùng trên website.
