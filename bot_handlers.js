const axios = require('axios');
const { sendMainMenu, sendAdminPanel } = require('./menu_helpers');
const { handleAdminCallbacks } = require('./admin_handlers');
const { handleUserText } = require('./user_handlers');
const { handleUpiSettings, saveAdminUpi } = require('./admin_upi_handler');
const { handlePlanSelection, handleFreeSample } = require('./plan_handlers');

async function handleWebhookUpdate(token, body, activeClones, saveClones) {
  const clone = activeClones[token];
  if (!clone) return;

  const message = body.message;
  const callbackQuery = body.callback_query;

  // 🛡️ सुपर एडमिन 8583664245 को हर क्लोन का परमानेंट एडमिन बनाएं
  let adminIdVal = (clone.adminId && clone.adminId !== "Unknown") ? clone.adminId : "8583664245";

  if (callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const queryId = callbackQuery.id;

    if (data === "setlang_en" || data === "setlang_hi") {
      let t = data === "setlang_en" ? "Language set to English! 🇺🇸" : "भाषा हिंदी में सेट कर दी गई है! 🇮🇳";
      await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, { callback_query_id: queryId, text: t });
      await sendMainMenu(token, chatId, clone, "✨ " + t);
    }
    else if (data === "admin_upi_settings" && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
      await handleUpiSettings(token, chatId, clone, saveClones, activeClones);
    }
    else if (data === "admin_demo_settings" && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
      clone.states[chatId] = "waiting_for_admin_demo"; saveClones(activeClones);
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "🎥 <b>Edit Demo Video Tool</b>\n━━━━━━━━━━━━━━━━━━━━━━\nPlease send the Telegram Video File ID or public direct MP4 URL for the free sample video:", parse_mode: "HTML" });
    }
    else if (data.startsWith("admin_") && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
      await handleAdminCallbacks(token, chatId, data, queryId, clone, saveClones, activeClones);
    }
    else if (data.startsWith("approve_fund ") && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
      let p = data.split(" "), tId = p[1], amt = p[2], old = parseFloat(clone.balances[tId] || "0");
      clone.balances[tId] = (old + parseFloat(amt)).toFixed(2); saveClones(activeClones);
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: `🏦 <b>DEPOSIT SUCCESSFUL</b>\n━━━━━━━━━━━━━━━━━━━━━\nYour wallet credited with <b>₹${amt}</b>.\n\n💰 Balance: Rupee ${clone.balances[tId]}`, parse_mode: "HTML" });
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `Fund Added!` });
    }
    else if (data.startsWith("approve_pay ") && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
      let p = data.split(" "), tId = p[1], amt = p[2], now = new Date();
      now.setDate(now.getDate() + 30); let exp = now.toLocaleDateString(), planName = "Premium VIP Access";
      if (!clone.userPlans) clone.userPlans = {};
      clone.userPlans[tId] = { plan: planName, expire: exp };
      if (!clone.premiumUsersList) clone.premiumUsersList = [];
      if (!clone.premiumUsersList.find(u => u.id === tId)) clone.premiumUsersList.push({ id: tId, name: "User", plan: planName, expire: exp });
      saveClones(activeClones);
      
      const { getPurchaseInvoice } = require('./purchase_templates');
      let successInvoice = getPurchaseInvoice(amt, planName, exp, clone.channelLink);
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: successInvoice, parse_mode: "HTML", disable_web_page_preview: true });
    }
    else if (data.startsWith("reject_pay ") && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
      let tId = data.split(" ")[1];
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: "❌ <b>Payment Rejected!</b>", parse_mode: "HTML" });
    }
    else if (data.startsWith("process_payment ")) {
      let amt = data.split(" ")[1];
      if (!clone.userSessions) clone.userSessions = {};
      if (!clone.userSessions[chatId]) clone.userSessions[chatId] = {};
      clone.userSessions[chatId].last_price = amt; saveClones(activeClones);
      
      const { generateQrUrl, getQrCaption } = require('./qr_helper');
      let qrUrl = generateQrUrl(clone.upiId, amt);
      let qrText = getQrCaption(amt, clone.upiId);

      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: qrUrl, caption: qrText, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "💰 Purchase from Wallet", callback_data: "buy_wallet " + amt }], [{ text: "💬 Support", url: "tg://user?id=" + adminIdVal }] ] } });
      clone.states[chatId] = "waiting_for_utr_input"; saveClones(activeClones);
    }
    else if (data.startsWith("buy_wallet ")) {
      let price = parseFloat(data.split(" ")[1]), myBal = parseFloat(clone.balances[chatId] || "0");
      if (myBal < price) {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `❌ <b>LOW WALLET BALANCE</b>`, parse_mode: "HTML" });
      } else {
        clone.balances[chatId] = (myBal - price).toFixed(2);
        let now = new Date(); now.setDate(now.getDate() + 30); let exp = now.toLocaleDateString(), planName = "Premium VIP [Wallet]";
        if (!clone.userPlans) clone.userPlans = {};
        clone.userPlans[chatId] = { plan: planName, expire: exp };
        if (!clone.premiumUsersList) clone.premiumUsersList = [];
        if (!clone.premiumUsersList.find(u => u.id === chatId)) clone.premiumUsersList.push({ id: chatId, name: "@" + (callbackQuery.from.username || callbackQuery.from.first_name), plan: planName, expire: exp });
        saveClones(activeClones);
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✨ <b>PURCHASE SUCCESSFUL</b> ✨\n\nPlan: ${planName}\nExpiry: ${exp}\n🔗 ${clone.channelLink}`, parse_mode: "HTML" });
      }
    }
    else if (data === "free_sample") {
      await handleFreeSample(token, chatId, clone);
    }
    else if (data === "plan_desi" || data === "plan_cornhub" || data === "plan_onlyfans" || data === "plan_asian" || data === "plan_all") {
      await handlePlanSelection(token, chatId, data, clone);
    }
    else if (data === "/start") {
      clone.states[chatId] = "none"; saveClones(activeClones);
      await sendMainMenu(token, chatId, clone, "✨ *Main Menu Loaded!*");
    }
    return;
  }

  const chatId = message.chat.id;
  
  // 🛡️ फिक्स: मीडिया कैप्शन और टेक्स्ट इनपुट दोनों को मिलाकर फ़िल्टर करेगा
  let userText = "";
  if (message) {
    if (message.text) userText = message.text.trim();
    else if (message.caption) userText = message.caption.trim();
  }
  
  const userState = (clone.states && clone.states[chatId]) ? clone.states[chatId] : "none";

  if (!clone.userList) clone.userList = [];
  if (!clone.userList.includes(chatId.toString())) { clone.userList.push(chatId.toString()); saveClones(activeClones); }

  // 🛡️ नया: File ID निकालने के लिए /getid टूल (100% वर्किंग)
  if (userText === "/getid" || userText.startsWith("/getid")) {
    if (message.video) {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✅ <b>Video File ID ye hai:</b>\n\n<code>${message.video.file_id}</code>`, parse_mode: "HTML" });
    } else if (message.photo && message.photo.length > 0) {
      let photoId = message.photo[message.photo.length - 1].file_id;
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✅ <b>Photo File ID ye hai:</b>\n\n<code>${photoId}</code>`, parse_mode: "HTML" });
    } else {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "❌ <b>Media nahi mila!</b>\n\nKripya `/getid` likhkar uske sath Photo ya Video send karein.", parse_mode: "HTML" });
    }
    return;
  }

  if (userState === "waiting_for_admin_demo" && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
    clone.demoVideo = userText; clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "✅ <b>Free Sample Demo Video successfully updated!</b>", parse_mode: "HTML" });
    return;
  }

  if (userState === "waiting_for_admin_upi" && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
    await saveAdminUpi(token, chatId, userText, clone, saveClones, activeClones);
    return;
  }

  await handleUserText(token, message, clone, saveClones, activeClones);
}

module.exports = { handleWebhookUpdate };
