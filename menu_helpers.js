const axios = require('axios');

async function sendMainMenu(token, chatId, clone, headerText) {
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: headerText, parse_mode: "Markdown" });
  
  let banner = "https://i.ibb.co/vC20qjwS/x.jpg";
  let caption = "*Choose Your Perfect Plan ‼*\n\n" +
                "🔥 _Unlock premium materials instantly_\n" +
                "🔄 _Limited-time access • High-quality content_\n\n" +
                "📅 *Secure UPI Payments*\n" +
                "⚡ *Fast Delivery: Within 1 sec*\n" +
                "👤 *Trusted by 1000+ users*\n\n" +
                "‼ _Hurry! Prices may increase soon_\n\n" +
                "🔦 *Select your plan below & get started:*";

  let inline_btns = [
    [{ text: "🔞 Viral Mms [Desi]", callback_data: "process_payment " + (clone.prices.desi || "149") }, { text: "🌽 CornHub", callback_data: "process_payment " + (clone.prices.cornhub || "99") }],
    [{ text: "🔞 Onlyfans/Stripchat", callback_data: "process_payment " + (clone.prices.onlyfans || "149") }, { text: "🥗 Asian/Korean/Jav", callback_data: "process_payment " + (clone.prices.asian || "150") }],
    [{ text: "🎆 All in One [20% off]", callback_data: "process_payment " + (clone.prices.all || "399") }],
    [{ text: "🎁 Free Sample [Demo]", callback_data: "free_sample" }, { text: "🔗 Refer & Earn", callback_data: "refer_earn" }]
  ];

  let replyKeyboard = {
    keyboard: [
      [{ text: "🛒 Buy Vip Membership" }, { text: "👤 My profile" }],
      [{ text: "💰 Deposit" }, { text: "🌐 Language" }],
      [{ text: "🎧 Support" }]
    ],
    resize_keyboard: true
  };

  await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
    chat_id: chatId, photo: banner, caption: caption, parse_mode: "Markdown",
    reply_markup: { inline_keyboard: inline_btns }
  });

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId, text: "🟢 *Interactive Keyboard Activated*", parse_mode: "Markdown",
    reply_markup: replyKeyboard
  });
}

async function sendAdminPanel(token, chatId, clone) {
  let adminMsg = "👑 *Admin Control Panel* 👑\n\nManage your premium users and bot settings:";
  let buttons = [
    [{ text: "💎 Premium Users", callback_data: "admin_premium_users" }],
    [{ text: "🔗 Channel link", callback_data: "admin_link" }, { text: "💰 Add fund", callback_data: "admin_fund" }],
    [{ text: "📊 Stats", callback_data: "admin_stats" }, { text: "📢 Broadcast", callback_data: "admin_broadcast" }],
    [{ text: "📋 Active plans", callback_data: "admin_active" }, { text: "💵 Change Price", callback_data: "admin_price" }],
    [{ text: "🤖 Bot user", callback_data: "admin_fake" }]
  ];
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: adminMsg, parse_mode: "Markdown", reply_markup: { inline_keyboard: buttons } });
}

module.exports = { sendMainMenu, sendAdminPanel };
