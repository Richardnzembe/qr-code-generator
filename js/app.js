'use strict';

(() => {
  const form = document.querySelector('#qr-form');
  const content = document.querySelector('#content');
  const canvas = document.querySelector('#qr-canvas');
  const error = document.querySelector('#error');
  const status = document.querySelector('#status');
  const caption = document.querySelector('#preview-caption');
  const pngButton = document.querySelector('#download-png');
  const svgButton = document.querySelector('#download-svg');
  const encoder = new TextEncoder();
  let currentQR = null;
  let currentContact = null;
  const vcfButton = document.querySelector('#download-vcf');
  const contactFields = document.querySelector('#contact-fields');
  const contactPreview = document.querySelector('#contact-preview');
  let timer;
  const decoration = document.querySelector('#decoration');
  const correction = document.querySelector('#correction');
  const logoFile = document.querySelector('#logo-file');
  const logoError = document.querySelector('#logo-error');
  let logo = null;
  let logoLoading = false;
  let uploadVersion = 0;
  let previousType = 'url';
  let savedCorrection = correction.value;
  const drafts = { url: '', text: '', phone: '', contact: '' };
  const icons = { star: '★', heart: '♥', phone: '☎' };
  const hasOverlay = () => Boolean(icons[decoration.value] || (decoration.value === 'upload' && logo));
  const selected = name => form.querySelector(`input[name="${name}"]:checked`).value;

  if (typeof qrcode !== 'function') {
    error.textContent = 'The QR encoder could not load. Please reload the page.';
    error.hidden = false;
    return;
  }
  qrcode.stringToBytes = text => Array.from(encoder.encode(text));

  // One raster overlay is shared by the canvas and SVG exports.
  function overlayCanvas() {
    if (!hasOverlay()) return null;
    const layer = document.createElement('canvas');
    layer.width = layer.height = 256;
    const ctx = layer.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    if (decoration.value === 'upload') {
      const scale = 196 / Math.max(logo.width, logo.height);
      const width = logo.width * scale;
      const height = logo.height * scale;
      ctx.drawImage(logo, (256 - width) / 2, (256 - height) / 2, width, height);
    } else {
      ctx.fillStyle = selected('color');
      ctx.font = '168px "Segoe UI Symbol", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[decoration.value], 128, 136);
    }
    return layer;
  }

  function syncDecoration() {
    const active = hasOverlay();
    if (active && !correction.disabled) savedCorrection = correction.value;
    if (!active && correction.disabled) correction.value = savedCorrection;
    if (active) correction.value = 'H';
    correction.disabled = active;
    document.querySelector('#upload-controls').hidden = decoration.value !== 'upload';
  }

  function draw(qr) {
    const size = Number(document.querySelector('#size').value);
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const count = qr.getModuleCount();
    const cell = Math.floor(size / (count + 8));
    const offset = Math.floor((size - count * cell) / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = selected('color');
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) ctx.fillRect(offset + col * cell, offset + row * cell, cell, cell);
      }
    }
    const overlay = overlayCanvas();
    if (overlay) {
      const width = count * cell * 0.18;
      const start = offset + (count * cell - width) / 2;
      ctx.drawImage(overlay, start, start, width, width);
    }
  }

  function disableDownloads() {
    currentQR = null;
    currentContact = null;
    vcfButton.disabled = true;
    contactPreview.hidden = true;
    pngButton.disabled = svgButton.disabled = true;
  }

  function readContact() {
    const data = {};
    for (const field of ['first', 'last', 'phone', 'email', 'company', 'title', 'street', 'city', 'country', 'website', 'socials', 'notes']) {
      data[field] = document.querySelector(`#contact-${field}`).value;
    }
    data.countryCode = document.querySelector('#country-code').value;
    return QranzieContact.build(data);
  }

  function showContact(card) {
    const details = document.querySelector('#contact-details');
    details.replaceChildren();
    for (const [label, value] of [['Name', card.name], ...card.details]) {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      details.append(term, description);
    }
    contactPreview.hidden = false;
  }

  function generate(explicit = false) {
    clearTimeout(timer);
    disableDownloads();
    error.hidden = true;
    content.removeAttribute('aria-invalid');
    syncDecoration();
    if (logoLoading && decoration.value === 'upload') {
      status.textContent = 'Loading your logo…';
      return;
    }
    const raw = content.value;
    const isContact = selected('type') === 'contact';
    vcfButton.hidden = !isContact;
    const byteCount = encoder.encode(raw).length;
    document.querySelector('#counter').textContent = `${byteCount.toLocaleString()} / 1,000 bytes`;
    let value = selected('type') === 'url' ? raw.trim() : raw;
    try {
      let card = null;
      if (isContact) {
        document.querySelector('#contact-counter').textContent = 'Complete your contact details below.';
        card = readContact();
        document.querySelector('#contact-counter').textContent = `${card.bytes.toLocaleString()} / 1,000 bytes`;
        if (card.bytes > 1000) throw new Error('Your contact card is too large. Shorten notes or links to stay within 1,000 bytes.');
        value = card.vcard;
      }
      if (!value.trim()) {
        const sample = qrcode(0, hasOverlay() ? 'H' : 'M');
        sample.addData('https://example.com');
        sample.make();
        draw(sample);
        canvas.setAttribute('aria-label', 'Sample QR code for example.com');
        caption.textContent = 'A little preview of what’s possible.';
        status.textContent = 'Add your content to make your own.';
        if (explicit) throw new Error('Enter a website link, text, or a phone number first.');
        return;
      }
      if (!isContact && byteCount > 1000) throw new Error('Please shorten your content to 1,000 UTF-8 bytes or fewer.');
      if (selected('type') === 'url') {
        if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
        let url;
        try { url = new URL(value); } catch { throw new Error('Enter a valid website link, such as https://example.com.'); }
        if (!url.hostname.includes('.') || /\s/.test(value) || url.username || url.password || !['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Enter a valid public website link without spaces or login details.');
        }
        value = url.href;
      }
      if (selected('type') === 'phone') {
        let number = value.trim();
        if (!/^\+?[\d\s().-]+$/.test(number)) throw new Error('Enter a phone number using digits, with an optional + country code.');
        number = number.replace(/[\s().-]/g, '');
        if (number.startsWith('00')) number = `+${number.slice(2)}`;
        if (!number.startsWith('+')) {
          const country = document.querySelector('#country-code').value.trim();
          if (!/^\+[1-9]\d{0,2}$/.test(country)) throw new Error('Enter a country calling code, such as +263.');
          // Remove a local trunk prefix when adding the country calling code.
          number = country + number.replace(/^0/, '');
        }
        if (!/^\+[1-9]\d{6,14}$/.test(number)) throw new Error('Enter a valid international number containing 7–15 digits.');
        value = `tel:${number}`;
      }
      const qr = qrcode(0, correction.value);
      qr.addData(value, 'Byte');
      qr.make();
      draw(qr);
      currentQR = qr;
      canvas.setAttribute('aria-label', `QR code for ${isContact ? 'your contact card' : selected('type') === 'phone' ? 'your phone number' : selected('type') === 'url' ? 'your website link' : 'your text'}`);
      caption.textContent = isContact ? card.name : value.length > 65 ? `${value.slice(0, 62)}…` : value;
      status.textContent = isContact ? 'Scan to review and optionally save this contact.' : selected('type') === 'phone' ? 'Scan to open this number in your phone’s dialler.' : 'Ready to download. Give it a scan!';
      if (card) { currentContact = card; vcfButton.disabled = false; showContact(card); }
      pngButton.disabled = svgButton.disabled = false;
    } catch (issue) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      canvas.setAttribute('aria-label', 'No QR code: check your content');
      caption.textContent = 'Let’s fix that first.';
      status.textContent = 'Check your content to generate a code.';
      error.textContent = issue instanceof Error ? issue.message : 'This content is too large. Try shorter text or lower error correction.';
      error.hidden = false;
      if (!isContact) content.setAttribute('aria-invalid', 'true');
    }
  }

  function download(blob, extension) {
    if (!blob) { status.textContent = 'Download failed. Please try again.'; return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qranzie-code.${extension}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    status.textContent = `${extension.toUpperCase()} download started. Happy sharing!`;
  }

  form.addEventListener('submit', event => { event.preventDefault(); generate(true); });
  content.addEventListener('input', () => {
    disableDownloads();
    status.textContent = 'Updating your preview…';
    clearTimeout(timer);
    timer = setTimeout(() => generate(), 180);
  });
  contactFields.addEventListener('input', () => {
    disableDownloads();
    status.textContent = 'Updating your contact…';
    clearTimeout(timer);
    timer = setTimeout(() => generate(), 250);
  });
  form.addEventListener('change', event => {
    if (event.target === logoFile) return;
    if (event.target.name === 'type') {
      drafts[previousType] = content.value;
      previousType = selected('type');
      content.value = drafts[previousType];
      const settings = {
        url: ['Your website link', 'Paste a link. We’ll handle the rest.', 'https://example.com', 'url'],
        text: ['Your text', 'A note, a message, or something worth sharing.', 'Write something worth scanning…', 'text'],
        phone: ['Your phone number', 'Use a local number with the country code above, or a full + international number.', '0779019896 or +263779019896', 'tel'],
        contact: ['Your contact card', '', '', 'text']
      }[previousType];
      document.querySelector('#content-label').textContent = settings[0];
      document.querySelector('#input-hint').textContent = settings[1];
      content.placeholder = settings[2];
      content.setAttribute('inputmode', settings[3]);
      document.querySelector('#phone-settings').hidden = !['phone', 'contact'].includes(previousType);
      document.querySelector('#content-field').hidden = previousType === 'contact';
      contactFields.hidden = previousType !== 'contact';
      contactFields.disabled = previousType !== 'contact';
      vcfButton.hidden = previousType !== 'contact';
    }
    if (event.target === decoration) logoError.hidden = true;
    generate();
  });
  document.querySelector('#country-code').addEventListener('input', () => generate());
  logoFile.addEventListener('change', async () => {
    const file = logoFile.files[0];
    if (!file) return;
    const version = ++uploadVersion;
    logo = null;
    logoLoading = true;
    logoError.hidden = true;
    generate();
    let objectURL;
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG, or WebP image.');
      if (file.size > 2 * 1024 * 1024) throw new Error('Choose an image smaller than 2 MB.');
      objectURL = URL.createObjectURL(file);
      const image = new Image();
      image.src = objectURL;
      await image.decode();
      if (version !== uploadVersion) return;
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 25000000) throw new Error('Choose an image with fewer than 25 million pixels.');
      // Normalize to a small local PNG-compatible canvas before any export.
      logo = document.createElement('canvas');
      const ratio = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      logo.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      logo.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      logo.getContext('2d').drawImage(image, 0, 0, logo.width, logo.height);
    } catch (issue) {
      if (version !== uploadVersion) return;
      logoError.textContent = issue instanceof Error && issue.name !== 'EncodingError' ? issue.message : 'That image could not be opened. Choose another PNG, JPG, or WebP.';
      logoError.hidden = false;
      logoFile.value = '';
    } finally {
      if (objectURL) URL.revokeObjectURL(objectURL);
      if (version === uploadVersion) { logoLoading = false; generate(); }
    }
  });
  document.querySelector('#remove-logo').addEventListener('click', () => {
    uploadVersion++;
    logoLoading = false;
    logo = null;
    logoFile.value = '';
    decoration.value = 'none';
    logoError.hidden = true;
    generate();
  });
  pngButton.addEventListener('click', () => {
    if (currentQR) canvas.toBlob(blob => download(blob, 'png'), 'image/png');
  });
  vcfButton.addEventListener('click', () => {
    if (currentContact) download(new Blob([currentContact.vcard], { type: 'text/vcard;charset=utf-8' }), 'vcf');
  });
  svgButton.addEventListener('click', () => {
    if (!currentQR) return;
    const count = currentQR.getModuleCount();
    const dimension = count + 8;
    let path = '';
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (currentQR.isDark(row, col)) path += `M${col + 4},${row + 4}h1v1h-1z`;
      }
    }
    const overlay = overlayCanvas();
    const width = count * 0.18;
    const start = (dimension - width) / 2;
    const image = overlay ? `<image x="${start}" y="${start}" width="${width}" height="${width}" href="${overlay.toDataURL('image/png')}"/>` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" width="1024" height="1024" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="${selected('color')}"/>${image}</svg>`;
    download(new Blob([svg], { type: 'image/svg+xml' }), 'svg');
  });
  generate();
})();
