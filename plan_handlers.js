const axios = require('axios');

async function handlePlanSelection(token, chatId, data, clone) {
  // 1. सबसे पहले 💦 सेंड करें
  try { await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "💦" }); } catch(e){}

  let photo, txt, p1, p2, p3;
  let prices = clone.prices || {};

  if (data === "plan_asian") {
    photo = "https://i.ibb.co/1YNMVKTL/x.jpg";
    p1 = prices.asian || "150"; p2 = "349"; p3 = "999";
    txt = `<b>Buy Asian Plan</b>\n\n😀 Content Details:\n😀 Asian 😀\n😀 Korean 😀\n😀 Chinese 😀\n😀 JAV (japanese) 😀\n😀 Live Action 😀\n😀 ...and many more updates!\n\n😀 Best membership in the whole market with a timely content update guarantee!\n\nChoose Your Plan Duration Below:`;
  }
  else if (data === "plan_all") {
    photo = "https://i.ibb.co/mVkLbvhN/x.jpg";
    p1 = prices.all || "399"; p2 = "999"; p3 = "2799";
    txt = `<b>Buy All in One Plan</b>\n\n😀 Content Details:\n😀 Viral 😀\n😀 Cornhub 😀\n😀 Onlyfans / Stripchat 😀\n😀 Asian / Korean / JAV 😀\n\n😀 Get all plan benefits included in this!\n---\n😀 Best membership in the whole market with a timely content update guarantee!\n\nChoose Your Plan Duration Below:`;
  }
  else if (data === "plan_onlyfans") {
    photo = "https://i.ibb.co/1YNMVKTL/x.jpg";
    p1 = prices.onlyfans || "149"; p2 = "349"; p3 = "999";
    txt = `<b>Buy Onlyfans Plan</b>\n\n😀 Content Details:\n😀 Onlyfans Videos 😀\n😀 Faphouse Videos\n😀 Aditi Mistri Videos\n😀 Comatozee Videos\n😀 Pankhuri Kunal Videos\n😀 ...and many more updates!\n\n😀 Best membership in the whole market with a timely content update guarantee!\n\nChoose Your Plan Duration Below:`;
  }
  else if (data === "plan_cornhub") {
    photo = "https://i.ibb.co/Kx52sLSR/x.jpg";
    p1 = prices.cornhub || "99"; p2 = "239"; p3 = "699";
    txt = `<b>Buy Cornhub Plan</b>\n\n😀 Content Details:\n😀 Brazzers premium\n😀 Cornhub premium 😀\n😀 Xhamster\n😀 Naughty america\n😀 Reality King\n😀 ...and many more updates!\n\n😀 Best membership in the whole market with a timely content update guarantee!\n\nChoose Your Plan Duration Below:`;
  }
  else if (data === "plan_desi") {
    photo = "https://i.ibb.co/MxTRHgx0/x.jpg";
    p1 = prices.desi || "149"; p2 = "349"; p3 = "999";
    txt = `<b>Buy Desi Plan</b>\n\n😀 Premium Content Included:\n😀 Instagram Viral Videos\n😀 Viral Demand Videos\n😀 Paki Collection\n😀 Snapchat Videos\n😀 Tango Live\n😀 ...and many more updates!\n\n😀 Best membership in the whole market!\n\nChoose Your Plan Duration Below:`;
  }

  let btns = [
    [{ text: `🔋 1 Month ₹${p1}`, callback_data: `process_payment ${p1}` }],
    [{ text: `🔋 3 Month [20% off] ₹${p2}`, callback_data: `process_payment ${p2}` }],
    [{ text: `🔋 1 Year [40% off] ₹${p3}`, callback_data: `process_payment ${p3}` }],
    [{ text: "⬅️ Back", callback_data: "/start" }]
  ];

  await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
    chat_id: chatId, photo: photo, caption: txt, parse_mode: "HTML", reply_markup: { inline_keyboard: btns }
  });
}

async function handleFreeSample(token, chatId, clone) {
  try { await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "👅" }); } catch(e){}

  let id_1 = "BAACAgUAAxkBAAIF6WpZHvsF8pgsMEVazsVWLYIRCnFuAAKGJQACDtvJViVZVSzsncNbPQQ";
  let id_2 = "BAACAgUAAxkBAAIF6mpZHv7-NbmFAz_a__3iwTsmeIWZAAKHJQACDtvJVhdNe1Wsvxk8PQQ";

  let demoMsg = "🔥 <b>FREE SAMPLE CONTENT</b> 🔥\n━━━━━━━━━━━━━━━━━━━━━\nYe hamare premium collection ka ek chota sa demo hai.\n\n💎 <b>Premium mein kya milega?</b>\n✅ Full length 4K Videos\n✅ Daily 50+ New Updates\n✅ Private Community Access\n━━━━━━━━━━━━━━━━━━━━━\n👇 <b>Full access ke liye niche plan chuno:</b>";
  let btns = [
    [{ text: "🚀 Buy VIP Membership", callback_data: "/start" }],
    [{ text: "🏠 Main Menu", callback_data: "/start" }]
  ];

  try {
    // टेलीग्राम फ़ाइल आईडी से वीडियो भेजने की कोशिश करेगा
    await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, { chat_id: chatId, video: id_1 });
    await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, { chat_id: chatId, video: id_2, caption: demoMsg, parse_mode: "HTML", reply_markup: { inline_keyboard: btns } });
  } catch (error) {
    // 🛡️ फ़ैल-प्रूफ़ सुरक्षा: फ़ाइल आईडी काम न करने पर बिना क्रैश हुए इमेज सेंड कर देगा
    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
      chat_id: chatId, photo: "https://i.ibb.co/B5RbHpB9/x.jpg", caption: demoMsg, parse_mode: "HTML", reply_markup: { inline_keyboard: btns }
    });
  }
}

module.exports = { handlePlanSelection, handleFreeSample };
