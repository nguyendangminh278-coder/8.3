# University Wrapped 20/10 — Mobile Web

Website mobile chuyển từ Canva `WRAPPED 20/10` sang trải nghiệm dạng story.

## Hiện tại

- Nguồn thiết kế: Canva design `DAHYdLjF2Pw`.
- Kích thước gốc: `900 × 1600` (9:16).
- Website dùng 14 trang có nội dung; trang 15 của Canva hiện đang trống.
- Vuốt lên/xuống, chạm trái/phải, dùng phím mũi tên/Space đều chuyển trang được.
- Transition được làm lại theo kiểu card/story: slide + scale + blur nhẹ + easing mềm.
- Có progress bar, safe-area cho iPhone, reduced-motion và desktop preview.

## Cách website lấy hình

Website có 2 lớp nguồn và tự ưu tiên theo thứ tự:

1. **Ảnh local trong repo** — ổn định nhất, pixel-perfect nhất.
2. **Canva Embed** — dùng trực tiếp thiết kế Canva để khi Canva thay đổi thì website cũng cập nhật.

### 1) Ảnh local

Export các page từ Canva ở kích thước gốc và đặt vào:

```text
assets/pages/01.png
assets/pages/02.png
...
assets/pages/14.png
```

Có thể dùng `.webp`, `.png`, hoặc `.jpg`. Code sẽ tự dò file theo thứ tự WebP → PNG → JPG.

> Đây là mode nên dùng khi phát hành chính thức vì nhanh, ổn định và giữ nguyên layout Canva.

### 2) Canva Embed fallback

Nếu chưa có ảnh local, website dùng:

```text
https://www.canva.com/design/DAHYdLjF2Pw/view?embed&ui=<PAGE_ID>
```

Nếu iframe không hiện, mở Canva → **Share → See all → Embed → Embed** một lần để bật public embed.

## Chạy local

Có thể mở bằng bất kỳ static server nào, ví dụ:

```bash
python -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

Không nên mở trực tiếp `file://` vì trình duyệt có thể chặn một số request local/iframe.

## GitHub Pages

Repo là static site thuần HTML/CSS/JS, nên có thể publish trực tiếp bằng GitHub Pages từ branch `main`.

## File chính

- `index.html` — khung story mobile.
- `styles.css` — responsive + transition.
- `app.js` — page config, swipe/tap/keyboard, Canva deep-link, local asset fallback.
- `assets/pages/` — nơi để ảnh export từ Canva.
