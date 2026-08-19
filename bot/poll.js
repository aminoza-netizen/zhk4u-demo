/**
 * Бот ЖК 4U без власного сервера.
 * Запускається за розкладом у GitHub Actions: забирає нові повідомлення,
 * відповідає і підтверджує їх прочитаними. Стан між запусками не потрібен.
 */
const TOKEN = process.env.BOT_TOKEN;
const URL = 'https://aminoza-netizen.github.io/zhk4u-demo';
if (!TOKEN) { console.error('немає BOT_TOKEN'); process.exit(1); }

const api = async (method, body = {}) => {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!d.ok) console.warn(method, '→', d.description);
  return d.result;
};

const KEYBOARD = {
  keyboard: [
    [{ text: '🏠 Кабінет мешканця', web_app: { url: URL + '/' } }],
    [{ text: '🛠 Кабінет ЖЕКу', web_app: { url: URL + '/admin/' } }],
  ],
  resize_keyboard: true,
};

const HELLO = `<b>ЖК 4U</b> — вул. Академіка Булаховського, 2

У кабінеті: рахунки й квитанції, покази лічильників, заявки на поломку, перепустки для гостей, новини будинку, голосування та чат із диспетчером.

Натисніть кнопку нижче, щоб відкрити. Це демонстрація — дані вигадані.`;

const HELP = `Кнопка нижче відкриває кабінет.

Аварійна лінія: 0 800 30 12 12 (цілодобово)
Диспетчерська: Пн–Пт 08:00–19:00, Сб 09:00–15:00`;

(async () => {
  const updates = (await api('getUpdates', { timeout: 0, limit: 100 })) || [];
  console.log(`нових повідомлень: ${updates.length}`);

  for (const u of updates) {
    const m = u.message;
    if (!m || !m.chat) continue;
    const text = (m.text || '').trim();
    console.log(`  ${m.chat.id} @${m.from?.username || '—'}: ${text.slice(0, 40)}`);

    let reply = HELLO;
    if (text === '/help') reply = HELP;
    else if (text === '/id') reply = `Ваш Telegram-id: <code>${m.from.id}</code>`;

    await api('sendMessage', {
      chat_id: m.chat.id, text: reply, parse_mode: 'HTML', reply_markup: KEYBOARD,
    });
  }

  // підтверджуємо прочитане, щоб наступний запуск узяв лише нові
  if (updates.length) {
    await api('getUpdates', { offset: updates[updates.length - 1].update_id + 1, timeout: 0 });
    console.log('оновлення підтверджено');
  }
})().catch(e => { console.error(e.message); process.exit(1); });
