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
  let timer;
  const selected = name => form.querySelector(`input[name="${name}"]:checked`).value;

  if (typeof qrcode !== 'function') {
    error.textContent = 'The QR encoder could not load. Please reload the page.';
    error.hidden = false;
    return;
  }
  qrcode.stringToBytes = text => Array.from(encoder.encode(text));

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
  }

  function disableDownloads() {
    currentQR = null;
    pngButton.disabled = svgButton.disabled = true;
  }

  function generate(explicit = false) {
    clearTimeout(timer);
    disableDownloads();
    error.hidden = true;
    content.removeAttribute('aria-invalid');
    const raw = content.value;
    const byteCount = encoder.encode(raw).length;
    document.querySelector('#counter').textContent = `${byteCount.toLocaleString()} / 1,000 bytes`;
    let value = selected('type') === 'url' ? raw.trim() : raw;
    try {
      if (!value.trim()) {
        const sample = qrcode(0, 'M');
        sample.addData('https://example.com');
        sample.make();
        draw(sample);
        canvas.setAttribute('aria-label', 'Sample QR code for example.com');
        caption.textContent = 'A little preview of what’s possible.';
        status.textContent = 'Add your content to make your own.';
        if (explicit) throw new Error('Enter a website link or some text first.');
        return;
      }
      if (byteCount > 1000) throw new Error('Please shorten your content to 1,000 UTF-8 bytes or fewer.');
      if (selected('type') === 'url') {
        if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
        let url;
        try { url = new URL(value); } catch { throw new Error('Enter a valid website link, such as https://example.com.'); }
        if (!url.hostname.includes('.') || /\s/.test(value) || url.username || url.password || !['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Enter a valid public website link without spaces or login details.');
        }
        value = url.href;
      }
      const qr = qrcode(0, document.querySelector('#correction').value);
      qr.addData(value, 'Byte');
      qr.make();
      draw(qr);
      currentQR = qr;
      canvas.setAttribute('aria-label', `QR code for ${selected('type') === 'url' ? 'your website link' : 'your text'}`);
      caption.textContent = value.length > 65 ? `${value.slice(0, 62)}…` : value;
      status.textContent = 'Ready to download. Give it a scan!';
      pngButton.disabled = svgButton.disabled = false;
    } catch (issue) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      canvas.setAttribute('aria-label', 'No QR code: check your content');
      caption.textContent = 'Let’s fix that first.';
      status.textContent = 'Check your content to generate a code.';
      error.textContent = issue instanceof Error ? issue.message : 'This content is too large. Try shorter text or lower error correction.';
      error.hidden = false;
      content.setAttribute('aria-invalid', 'true');
    }
  }

  function download(blob, extension) {
    if (!blob) { status.textContent = 'Download failed. Please try again.'; return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qraft-code.${extension}`;
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
  form.addEventListener('change', event => {
    if (event.target.name === 'type') {
      const isURL = selected('type') === 'url';
      document.querySelector('#content-label').textContent = isURL ? 'Your website link' : 'Your text';
      document.querySelector('#input-hint').textContent = isURL ? 'Paste a link. We’ll handle the rest.' : 'A note, a message, or something worth sharing.';
      content.placeholder = isURL ? 'https://example.com' : 'Write something worth scanning…';
    }
    generate();
  });
  pngButton.addEventListener('click', () => {
    if (currentQR) canvas.toBlob(blob => download(blob, 'png'), 'image/png');
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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" width="1024" height="1024" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="${selected('color')}"/></svg>`;
    download(new Blob([svg], { type: 'image/svg+xml' }), 'svg');
  });
  generate();
})();
