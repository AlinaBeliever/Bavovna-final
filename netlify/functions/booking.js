// Приймає заявку з форми й тихо надсилає її в Telegram.
// Потрібні змінні середовища в Netlify: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
const esc = (v) => String(v == null ? '' : v).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const json = (status, body) => ({ statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false });
  let d;
  try { d = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { ok: false }); }

  if (d['bot-field']) return json(200, { ok: true }); // спам-пастка: прикидаємось, що все добре

  const name = String(d.name || '').trim().slice(0, 100);
  const phone = String(d.phone || '').trim().slice(0, 40);
  if (name.length < 2 || phone.replace(/\D/g, '').length < 9) return json(400, { ok: false, error: 'invalid' });

  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return json(500, { ok: false, error: 'not-configured' });

  const lines = [
    '<b>Нова заявка на бронювання</b>',
    'Формат: ' + esc(String(d.format || '').slice(0, 100)),
    'Дата: ' + esc(String(d.date || '').slice(0, 10)),
    'Час: ' + esc(String(d.time || '').slice(0, 5)),
    'Гостей: ' + esc(parseInt(d.guests, 10) || ''),
    "Ім'я: " + esc(name),
    'Телефон: ' + esc(phone)
  ];
  const note = String(d.note || '').trim().slice(0, 1000);
  if (note) lines.push('Побажання: ' + esc(note));

  const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: lines.join('\n'), parse_mode: 'HTML' })
  });
  return res.ok ? json(200, { ok: true }) : json(502, { ok: false });
};
