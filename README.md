# Qraft — QR code generator

A responsive website built with plain HTML, CSS, and JavaScript. No framework, package manager, build step, API key, or backend.

## Open locally

Open `index.html` in a modern browser. All assets are bundled locally, so no internet connection is needed to generate codes.

## Features

- Website links, plain text (including Unicode and emoji), or phone numbers
- Contact cards with name, phone, email, company, job title, address, website, up to five social links, and notes
- Contact preview and a downloadable `.vcf` file, alongside QR PNG/SVG downloads
- Phone codes open the dialler; local Zimbabwe numbers use +263 by default, with an editable country calling code
- Optional star, heart, or phone icon, or a local PNG/JPG/WebP logo (up to 2 MB and 25 million pixels)
- Icons and logos included in both PNG and SVG downloads; maximum error correction is applied automatically
- Live QR preview and validation (maximum 1,000 UTF-8 bytes)
- Five scan-friendly dark colours on white
- PNG downloads at 512, 1024, or 2048 pixels
- Scalable SVG downloads
- Standard, enhanced, or maximum error correction
- Keyboard-accessible controls and responsive mobile layout
- Content processed in the browser, with no analytics or uploads

The initial code is an example for `https://example.com`. Downloads are enabled after you enter valid content. Website links without a protocol get `https://` automatically. Codes are static: to change their contents, generate a new code. Linked websites must stay available. Always scan a downloaded code before printing or sharing it.

Phone numbers become `tel:` links, not WhatsApp links. For example, `0779019896` with country code `+263` becomes `tel:+263779019896`. A number beginning with `+` or `00` supplies its own country code. When entering a local number, one leading trunk zero is removed; for countries whose international number retains that zero, enter the full international number yourself.

Choose **Contact** to encode a vCard 3.0 contact directly into the QR code. A first or last name is required; other details are optional. Supported scanners offer a contact preview and let the recipient decide whether to save it. The website cannot control the recipient's scanner or automatically save a contact. Social links are included as URL properties and in notes, since contact apps differ in how many website fields they display. Use the `.vcf` download for direct sharing or importing. QR logos decorate the code; they are not contact photos.

The complete contact card, including vCard formatting, is limited to 1,000 UTF-8 bytes to keep it within the encoder's capacity at maximum correction. Shorten notes or links if it exceeds the limit. Anyone who has the QR code or VCF can read the included details. Contact data stays in the browser and is never uploaded or saved by the website.

Contact serialization follows [RFC 2426](https://www.rfc-editor.org/rfc/rfc2426.html). Run the contact tests with `node --test tests/contact.test.cjs` (Node is only needed for development tests, not for using or hosting the site).

Centre artwork is limited to 18% of the QR symbol width, including its white backing. This improves scan reliability but cannot guarantee every decorated code will scan under all conditions. Test your exported code on a phone before sharing. QR modules remain vector paths in SVG downloads; the centre artwork is an embedded PNG, so the SVG is self-contained. Uploads never leave the browser.

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
├── js/contact.js
├── js/vendor/qrcode.js
├── js/vendor/LICENSE
└── README.md
```

Edit `css/style.css` for the appearance and `js/app.js` for behavior.

## QR encoder credit

Includes [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) v1.4.4 by Kazuhiko Arase, used under the MIT license. The encoder is a small standalone JavaScript library, not a framework. Its source and license are included in `js/vendor/`.
