const axios = require('axios');

async function handleUpiSettings(token, chatId, clone, saveClones, activeClones) {
  clone.states[chatId] = "waiting_for_admin_upi";
  saveClones(activeClones);
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: "✏️ *UPI ID Settings Editor*\n━━━━━━━━━━━━━━━━━━━━━━\nEnter your new merchant UPI ID (e.g. `9012571891@ybl`):",
    parse_mode: "Markdown"
  });
}

async function saveAdminUpi(token, chatId, userText, clone, saveClones, activeClones) {
  clone.upiId = userText;
  clone.states[chatId] = "none";
  saveClones(activeClones);
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: "✅ *UPI ID successfully updated to:* `" + userText + "`",
    parse_mode: "Markdown"
  });
}

module.exports = { handleUpiSettings, saveAdminUpi };
