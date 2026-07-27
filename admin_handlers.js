const axios = require('axios');
const { sendAdminPanel } = require('./menu_helpers');
const { handleLinkPrompt } = require('./admin_link_handler'); // नया इम्पोर्ट
const { handleExpirePrompt } = require('./admin_expire_handler'); // नया इम्पोर्ट

async function handleAdminCallbacks(token, chatId, data, queryId, clone, saveClones, activeClones) {
  if (data === "admin_premium_users") {
    let listMsg = "💎 *Premium Users Data*\n━━━━━━━━━━━━━━━━━━━━━━\n\n";
    if (!clone.premiumUsersList || clone.premiumUsersList.length === 0) listMsg += "❌ No premium users found.";
    else {
      for (let u of clone.premiumUsersList) {
        listMsg += `👤 *User:* ${u.name}\n🆔 *ID:* \`${u.id}\`\n📦 *Plan:* ${u.plan}\n📅 *Expire:* ${u.expire}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      }
    }
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: listMsg, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🏠 Back to Admin", callback_data: "admin_back" }]] } });
  }
  else if (data === "admin_back") await sendAdminPanel(token, chatId, clone);
  else if (data === "admin_link") {
    await handleLinkPrompt(token, chatId, clone, saveClones, activeClones); // नए हैंडलर पर भेजें
  }
  else if (data === "admin_fund") {
    clone.states[chatId] = "waiting_for_fund_input"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "📩 *Send User ID and Amount:*" });
  }
  else if (data === "admin_stats") {
    let r = clone.userList ? clone.userList.length : 0;
    let f = parseInt(clone.fakeUsers || "0");
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `📊 *Bot Statistics*\n\n👥 Real Users: ${r}\n🤖 Fake Users: ${f}\n📈 Total Users: ${r + f}` });
  }
  else if (data === "admin_broadcast") {
    clone.states[chatId] = "waiting_for_broadcast_text"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "Send the message/photo you want to broadcast:" });
  }
  else if (data === "admin_active") {
    let msg = "📋 *Active Premium Users:*\n\n";
    if (!clone.premiumUsersList || clone.premiumUsersList.length === 0) msg += "No active premium users.";
    else {
      for (let u of clone.premiumUsersList) msg += `👤 Name: ${u.name}\n🆔 ID: \`${u.id}\`\n📦 Plan: ${u.plan}\n📅 Expire: ${u.expire}\n\n`;
    }
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: msg, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🧨 Expire User", callback_data: "admin_expire" }], [{ text: "🏠 Back", callback_data: "admin_back" }]] } });
  }
  else if (data === "admin_expire") {
    await handleExpirePrompt(token, chatId, clone, saveClones, activeClones); // नए हैंडलर पर भेजें
  }
  else if (data === "admin_price") {
    clone.states[chatId] = "waiting_for_price_input"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "Send Category & Price:" });
  }
  else if (data === "admin_fake") {
    clone.states[chatId] = "waiting_for_fake_count"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "Enter fake user count to increase:" });
  }
}

module.exports = { handleAdminCallbacks };
