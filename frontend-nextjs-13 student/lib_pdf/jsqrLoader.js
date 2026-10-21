// Minimal jsQR loader for browser
// Usage: import jsQR from './jsqrLoader';
// Loads jsQR from CDN and returns the global jsQR function
export default async function loadJsQR() {
  if (window.jsQR) return window.jsQR;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
  return window.jsQR;
}
