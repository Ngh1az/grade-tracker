const KEY = 'gt_theme';

export function getTheme() {
  return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
}

/** Ghi vào <html data-theme> và localStorage. Gọi ngay khi module load (xem main.jsx)
 * để tránh nháy sai theme trước khi React render lần đầu. */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
}
