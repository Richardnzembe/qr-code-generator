# Qraft — QR code generator

A responsive website built with plain HTML, CSS, and JavaScript. No framework, package manager, build step, API key, or backend.

## Open locally

Open `index.html` in a modern browser. All assets are bundled locally, so no internet connection is needed to generate codes.

## Features

- Website links or plain text, including Unicode and emoji
- Live QR preview and validation (maximum 1,000 UTF-8 bytes)
- Five scan-friendly dark colours on white
- PNG downloads at 512, 1024, or 2048 pixels
- Scalable SVG downloads
- Standard, enhanced, or maximum error correction
- Keyboard-accessible controls and responsive mobile layout
- Content processed in the browser, with no analytics or uploads

The initial code is an example for `https://example.com`. Downloads are enabled after you enter valid content. Website links without a protocol get `https://` automatically. Codes are static: to change their contents, generate a new code. Linked websites must stay available. Always scan a downloaded code before printing or sharing it.

## Host on GitHub Pages

1. Create a GitHub repository named `qr-code-generator`.
2. Upload **the contents of this folder** to the repository root. Keep the `css` and `js` folders intact, and include `.nojekyll`.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose **main** and **/ (root)**, then save.
6. When deployment finishes, use the URL GitHub displays, normally `https://YOUR-USERNAME.github.io/qr-code-generator/`.

If you keep this folder inside an existing GitHub Pages repository instead, it can be reached at that site's `/qr-code-generator/` path. This project has not been published automatically.

## Files

```text
qr-code-generator/
├── index.html
├── favicon.svg
├── .nojekyll
├── css/style.css
├── js/app.js
├── js/vendor/qrcode.js
├── js/vendor/LICENSE
└── README.md
```

Edit `css/style.css` for the appearance and `js/app.js` for behavior.

## QR encoder credit

Includes [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) v1.4.4 by Kazuhiko Arase, used under the MIT license. The encoder is a small standalone JavaScript library, not a framework. Its source and license are included in `js/vendor/`.
