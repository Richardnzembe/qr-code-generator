const test = require('node:test');
const assert = require('node:assert/strict');
const contact = require('../js/contact.js');
const empty = { first: '', last: '', phone: '', countryCode: '+263', email: '', company: '', title: '', street: '', city: '', country: '', website: '', socials: '', notes: '' };
const build = changes => contact.build({ ...empty, first: 'Richard', last: 'Nzembe', ...changes });
const unfold = value => value.replace(/\r\n /g, '');

test('contact contains mandatory vCard properties and normalized phone', () => {
  const card = build({ phone: '0779019896', email: 'richard@example.com', company: 'Example', title: 'Developer', street: '1 Main Street', city: 'Harare', country: 'Zimbabwe' });
  assert.ok(card.vcard.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n'));
  assert.ok(card.vcard.endsWith('END:VCARD\r\n'));
  for (const property of ['N:Nzembe;Richard;;;', 'FN:Richard Nzembe', 'TEL;TYPE=CELL:+263779019896', 'EMAIL;TYPE=INTERNET:richard@example.com', 'ADR;TYPE=WORK:;;1 Main Street;Harare;;;Zimbabwe']) assert.ok(card.vcard.includes(property));
  assert.equal(card.bytes, Buffer.byteLength(card.vcard));
});

test('optional fields are omitted; either first or last name is sufficient', () => {
  assert.ok(!build({}).vcard.includes('TEL:'));
  assert.equal(build({ first: '', last: 'Nzembe' }).name, 'Nzembe');
  assert.throws(() => build({ first: '', last: '' }), /name/);
});

test('social URLs are normalized, deduplicated, and retained in notes', () => {
  const card = unfold(build({ website: 'example.com', socials: 'https://instagram.com/example\nhttps://linkedin.com/in/example\nhttps://instagram.com/example' }).vcard);
  assert.ok(card.includes('URL:https://example.com/\r\n'));
  assert.equal((card.match(/URL:https:\/\/instagram.com\/example/g) || []).length, 1);
  assert.ok(card.includes('NOTE:Social links:\\nhttps://instagram.com/example\\nhttps://linkedin.com/in/example'));
});

test('escaped text cannot inject additional vCard properties', () => {
  const card = unfold(build({ first: 'Renée; Jr, \\ 🌍', notes: 'Hello\r\nEND:VCARD\r\nBEGIN:VCARD' }).vcard);
  assert.ok(card.includes('Renée\\; Jr\\, \\\\ 🌍'));
  assert.equal(card.split('\r\n').filter(line => line === 'END:VCARD').length, 1);
  assert.ok(card.includes('NOTE:Hello\\nEND:VCARD\\nBEGIN:VCARD'));
});

test('long Unicode lines fold without splitting UTF-8 characters', () => {
  const notes = '🌍é'.repeat(40);
  const card = build({ notes });
  assert.ok(card.vcard.split('\r\n').every(line => Buffer.byteLength(line) <= 75));
  assert.ok(unfold(card.vcard).includes(`NOTE:${notes}\r\n`));
});

test('malformed phone, email, unsafe links and excessive social links are rejected', () => {
  for (const change of [{ phone: 'abc' }, { email: 'bad@example' }, { socials: 'javascript:alert(1)' }, { website: 'https://user:pass@example.com' }, { socials: Array(6).fill('https://example.com').join('\n') }]) assert.throws(() => build(change));
  assert.equal(contact.phone('00263779019896', '+1'), '+263779019896');
  assert.equal(contact.phone('+263 77 901 9896', 'invalid'), '+263779019896');
});
