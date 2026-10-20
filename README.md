# University Wrapped 20/10 — Mobile Web

Website mobile chuyển từ Canva `WRAPPED 20/10` sang trải nghiệm dạng story, ưu tiên giữ nguyên artwork gốc và làm lại phần chuyển cảnh để trông tự nhiên hơn trên điện thoại.

## Nguồn thiết kế

- Canva design: `DAHYdLjF2Pw`
- Kích thước gốc: `900 × 1600` (9:16)
- Website dùng 14 trang có nội dung; trang 15 trên Canva hiện đang trống.

## Trải nghiệm mobile

- Vuốt lên/xuống để chuyển trang.
- Chạm bên phải để đi tiếp, bên trái để quay lại.
- Có drag feedback khi đang vuốt, vibration nhẹ trên thiết bị hỗ trợ, progress bar, safe-area cho iPhone và reduced-motion.
- Mỗi nhóm nội dung dùng một kiểu transition riêng thay vì lặp lại một hiệu ứng: timeline, zoom, ranking shutter, diagonal wipe, paper turn, flash, spotlight, photo depth, camera push, split và finale.

## Cách website giữ nguyên Canva

Website ưu tiên theo thứ tự:

1. `assets/pages/01.webp` → `14.webp`: snapshot 900×1600 từ Canva, nhanh và ổn định nhất.
2. Nếu snapshot chưa có, fallback sang Canva Embed.

`app.js` cũng hỗ trợ `.png` và `.jpg`, nhưng workflow mặc định tạo WebP chất lượng cao.

## Tự động snapshot Canva

Repo có workflow:

```text
.github/workflows/snapshot-canva.yml
```

và script:

```text
scripts/snapshot-canva.mjs
```

Workflow dùng Chromium/Playwright mở Canva ở chế độ embed, chụp tuần tự 14 page đúng viewport `900×1600`, chuyển sang WebP chất lượng cao rồi commit vào `assets/pages/`.

Có thể chạy lại thủ công trong GitHub:

```text
Actions → Snapshot Canva pages → Run workflow
```

Khi artwork trên Canva thay đổi, chạy workflow lại để đồng bộ ảnh website.

## Chạy local

```bash
python -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

## GitHub Pages

Đây là static site thuần HTML/CSS/JS, có thể publish trực tiếp bằng GitHub Pages từ branch `main`.

## File chính

- `index.html` — khung story mobile.
- `styles.css` — responsive, swipe feedback và transition riêng từng section.
- `app.js` — page config, local snapshot priority, Canva fallback, tap/swipe/keyboard.
- `scripts/snapshot-canva.mjs` — tự lấy page Canva thành ảnh 900×1600.
- `assets/pages/` — snapshot thực tế dùng trên website.
