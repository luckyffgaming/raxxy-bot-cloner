const axios = require('axios');

async function sendMainMenu(token, chatId, clone, headerText) {
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: headerText, parse_mode: "HTML" });
  let banner = "https://i.ibb.co/vC20qjwS/x.jpg";
  let caption = "<b>Choose Your Perfect Plan ‼</b>\n\n" +
                "🔥 <i>Unlock premium materials instantly</i>\n" +
                "🔄 <i>Limited-time access • High-quality content</i>\n\n" +
                "📅 <b>Secure UPI Payments</b>\n" +
                "⚡ <b>Fast Delivery: Within 1 sec</b>\n" +
                "👤 <b>Trusted by 1000+ users</b>\n\n" +
                "‼ <u>Hurry! Prices may increase soon</u>\n\n" +
                "🔦 Select your plan below & get started:";
  let inline_btns = [
    [{ text: "🔞 Viral Mms [Desi]", callback_data: "plan_desi" }, { text: "🌽 CornHub", callback_data: "plan_cornhub" }],
    [{ text: "🔞 Onlyfans/Stripchat", callback_data: "plan_onlyfans" }, { text: "🥗 Asian/Korean/Jav", callback_data: "plan_asian" }],
    [{ text: "🎆 All in One [20% off]", callback_data: "plan_all" }],
    [{ text: "🎁 Free Sample [Demo]", callback_data: "free_sample" }, { text: "🔗 Refer & Earn", callback_data: "refer_earn" }]
  ];
  let replyKeyboard = { keyboard: [[{ text: "🛒 Buy Vip Membership" }, { text: "👤 My profile" }], [{ text: "💰 Deposit" }, { text: "🌐 Language" }], [{ text: "🎧 Support" }]], resize_keyboard: true };
  await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: banner, caption: caption, parse_mode: "HTML", reply_markup: { inline_keyboard: inline_btns } });
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "🟢 <b>Interactive Keyboard Activated</b>", parse_mode: "HTML", reply_markup: replyKeyboard });
}

async function sendAdminPanel(token, chatId, clone) {
  let adminMsg = "👑 <b>Admin Control Panel</b> 👑\n\nManage settings:";
  let buttons = [[{ text: "💎 Premium Users", callback_data: "admin_premium_users" }], [{ text: "🔗 Channel link", callback_data: "admin_link" }, { text: "💰 Add fund", callback_data: "admin_fund" }], [{ text: "📊 Stats", callback_data: "admin_stats" }, { text: "📢 Broadcast", callback_data: "admin_broadcast" }], [{ text: "📋 Active plans", callback_data: "admin_active" }, { text: "💵 Change Price", callback_data: "admin_price" }], [{ text: "⚙️ Set UPI ID", callback_data: "admin_upi_settings" }, { text: "🎥 Edit Demo Video", callback_data: "admin_demo_settings" }], [{ text: "🤖 Bot user", callback_data: "admin_fake" }]];
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: adminMsg, parse_mode: "HTML", reply_markup: { inline_keyboard: buttons } });
}

module.exports = { sendMainMenu, sendAdminPanel };
