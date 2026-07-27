const axios = require('axios');

async function handleLinkPrompt(token, chatId, clone, saveClones, activeClones) {
  clone.states[chatId] = "waiting_for_channel_link";
  saveClones(activeClones);
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: "📩 <b>Send the new Telegram Channel Link:</b>",
    parse_mode: "HTML"
  });
}

async function saveChannelLink(token, chatId, userText, clone, saveClones, activeClones) {
  clone.channelLink = userText;
  clone.states[chatId] = "none";
  saveClones(activeClones);
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: "✅ <b>Success Link updated to:</b> " + userText,
    parse_mode: "HTML"
  });
}

module.exports = { handleLinkPrompt, saveChannelLink };
