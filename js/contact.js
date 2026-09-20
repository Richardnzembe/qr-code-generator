'use strict';

// vCard 3.0 (RFC 2426): CRLF lines, escaped text and UTF-8-safe folding.
const QranzieContact = (() => {
  const encoder = new TextEncoder();
  const escape = value => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  function fold(line) {
    let result = '', bytes = 0;
    for (const char of line) {
      const length = encoder.encode(char).length;
      if (bytes + length > 75) { result += '\r\n '; bytes = 1; }
      result += char;
      bytes += length;
    }
    return result;
  }
  function phone(raw, country) {
    let number = raw.trim();
    if (!/^\+?[\d ().-]+$/.test(number)) throw new Error('Enter a phone number using digits and an optional + country code.');
    number = number.replace(/[ ().-]/g, '');
    if (number.startsWith('00')) number = `+${number.slice(2)}`;
    if (!number.startsWith('+')) {
      if (!/^\+[1-9]\d{0,2}$/.test(country.trim())) throw new Error('Enter a country calling code, such as +263.');
      number = country.trim() + number.replace(/^0/, '');
    }
    if (!/^\+[1-9]\d{6,14}$/.test(number)) throw new Error('Enter a valid international phone number containing 7–15 digits.');
    return number;
  }
  function url(raw) {
    let value = raw.trim();
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    let parsed;
    try { parsed = new URL(value); } catch { throw new Error('Enter a full website or social profile link, such as https://instagram.com/yourname.'); }
    if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname.includes('.') || parsed.username || parsed.password || /\s/.test(value)) throw new Error('Website and social links must be public HTTP or HTTPS links without spaces or login details.');
    return parsed.href;
  }
  function build(input) {
    const data = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value.trim()]));
    const name = [data.first, data.last].filter(Boolean).join(' ');
    if (!name) throw new Error('Enter a first or last name for your contact card.');
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${escape(data.last)};${escape(data.first)};;;`, `FN:${escape(name)}`];
    const details = [];
    const add = (property, label, value) => { if (value) { lines.push(`${property}:${escape(value)}`); details.push([label, value]); } };
    if (data.phone) add('TEL;TYPE=CELL', 'Phone', phone(data.phone, data.countryCode));
    if (data.email && !/^[^\s@,;:]+@[^\s@,;:]+\.[^\s@,;:]+$/.test(data.email)) throw new Error('Enter a valid email address.');
    add('EMAIL;TYPE=INTERNET', 'Email', data.email);
    add('ORG', 'Company', data.company);
    add('TITLE', 'Job title', data.title);
    if (data.street || data.city || data.country) {
      lines.push(`ADR;TYPE=WORK:;;${escape(data.street)};${escape(data.city)};;;${escape(data.country)}`);
      details.push(['Address', [data.street, data.city, data.country].filter(Boolean).join(', ')]);
    }
    if (data.website) { const link = url(data.website); lines.push(`URL:${link}`); details.push(['Website', link]); }
    const socials = data.socials.split(/\r\n|\r|\n/).map(value => value.trim()).filter(Boolean);
    if (socials.length > 5) throw new Error('Add up to five social profile links, one per line.');
    const links = [...new Set(socials.map(url))];
    for (const link of links) { lines.push(`URL:${link}`); details.push(['Social link', link]); }
    // Notes preserve social links for contact apps that only display the first URL.
    const notes = [data.notes, links.length ? `Social links:\n${links.join('\n')}` : ''].filter(Boolean).join('\n\n');
    if (notes) lines.push(`NOTE:${escape(notes)}`);
    if (data.notes) details.push(['Notes', data.notes]);
    lines.push('END:VCARD');
    const vcard = lines.map(fold).join('\r\n') + '\r\n';
    return { name, details, vcard, bytes: encoder.encode(vcard).length };
  }
  return { build, phone };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = QranzieContact;
