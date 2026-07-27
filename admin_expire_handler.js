const axios = require('axios');

async function handleExpirePrompt(token, chatId, clone, saveClones, activeClones) {
  clone.states[chatId] = "waiting_for_expire_id";
  saveClones(activeClones);
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: "📩 <b>Please send the User ID to expire the plan:</b>\n\nExample: <code>8583664245</code>",
    parse_mode: "HTML"
  });
}

async function expireUserNow(token, chatId, userText, clone, saveClones, activeClones) {
  let target_id = userText.trim();
  
  if (clone.premiumUsersList) {
    clone.premiumUsersList = clone.premiumUsersList.filter(u => u.id !== target_id);
  }
  if (clone.userPlans) {
    delete clone.userPlans[target_id];
  }
  
  clone.states[chatId] = "none";
  saveClones(activeClones);

  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: "✅ User <code>" + target_id + "</code> expired and removed from list.",
    parse_mode: "HTML"
  });

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: target_id,
      text: "⚠️ <b>Your VIP plan has expired.</b>",
      parse_mode: "HTML"
    });
  } catch (e) {
    console.log("Failed to notify expired user.");
  }
}

module.exports = { handleExpirePrompt, expireUserNow };
