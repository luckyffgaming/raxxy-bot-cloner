const axios = require('axios'); // 👈 बिल्कुल सही: यहाँ अब 'express' के बजाय 'axios' लोड होगा
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

  // 🛡️ एडमिन आईडी की जांच करें (सुपर एडमिन 8583664245 हमेशा मान्य रहेगा)
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
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "🎥 *Edit Demo Video Tool*\n━━━━━━━━━━━━━━━━━━━━━━\nPlease send the Telegram Video File ID or public direct MP4 URL for the free sample video:", parse_mode: "Markdown" });
    }
    else if (data.startsWith("admin_") && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
      await handleAdminCallbacks(token, chatId, data, queryId, clone, saveClones, activeClones);
    }
    else if (data.startsWith("approve_fund ") && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
      let p = data.split(" "), tId = p[1], amt = p[2], old = parseFloat(clone.balances[tId] || "0");
      clone.balances[tId] = (old + parseFloat(amt)).toFixed(2); saveClones(activeClones);
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: `🏦 *DEPOSIT SUCCESSFUL*\n━━━━━━━━━━━━━━━━━━━━━\nYour wallet credited with *₹${amt}*.\n\n💰 Balance: Rupee ${clone.balances[tId]}`, parse_mode: "Markdown" });
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
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: `✨ *PURCHASE VERIFIED SUCCESSFULLY* ✨\n━━━━━━━━━━━━━━━━━━━━━\n🎉 Payment of *₹${amt}* verified.\n\n📦 *Plan:* ${planName}\n📅 *Expiry:* ${exp}\n🔗 ${clone.channelLink}`, parse_mode: "Markdown", disable_web_page_preview: true });
    }
    else if (data.startsWith("reject_pay ") && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
      let tId = data.split(" ")[1];
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: "❌ Payment Rejected!" });
    }
    else if (data.startsWith("process_payment ")) {
      let amt = data.split(" ")[1];
      if (!clone.userSessions) clone.userSessions = {};
      if (!clone.userSessions[chatId]) clone.userSessions[chatId] = {};
      clone.userSessions[chatId].last_price = amt; saveClones(activeClones);
      let upiLink = `upi://pay?pa=${clone.upiId}&pn=RaxxyDev&am=${amt}&cu=INR`, qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
      
      // 🛡️ फिक्स: यहाँ क्यूआर कोड के नीचे का टेक्स्ट बिल्कुल आपके पुराने फ़ॉर्मेट में कस्टमाइज्ड कर दिया गया है
      let qrText = `🏦 *Pay & Buy Plan*\n\n` +
                   `💰 Amount: *₹${amt}*\n` +
                   `🆔 UPI ID: \`${clone.upiId}\`\n\n` +
                   `1️⃣ Is QR ko scan karein, ₹${amt} apne aap fill ho jayega.\n` +
                   `2️⃣ Payment ke baad 12-digit UTR bhej dein 👇`;

      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: qrUrl, caption: qrText, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "💰 Purchase from Wallet", callback_data: "buy_wallet " + amt }], [{ text: "💬 Support", url: "tg://user?id=" + adminIdVal }] ] } });
      clone.states[chatId] = "waiting_for_utr_input"; saveClones(activeClones);
    }
    else if (data.startsWith("buy_wallet ")) {
      let price = parseFloat(data.split(" ")[1]), myBal = parseFloat(clone.balances[chatId] || "0");
      if (myBal < price) {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `❌ *LOW WALLET BALANCE*` });
      } else {
        clone.balances[chatId] = (myBal - price).toFixed(2);
        let now = new Date(); now.setDate(now.getDate() + 30); let exp = now.toLocaleDateString(), planName = "Premium VIP [Wallet]";
        if (!clone.userPlans) clone.userPlans = {};
        clone.userPlans[chatId] = { plan: planName, expire: exp };
        if (!clone.premiumUsersList) clone.premiumUsersList = [];
        if (!clone.premiumUsersList.find(u => u.id === chatId)) clone.premiumUsersList.push({ id: tId, name: "@" + (callbackQuery.from.username || callbackQuery.from.first_name), plan: planName, expire: exp });
        saveClones(activeClones);
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✨ *PURCHASE SUCCESSFUL* ✨\n\nPlan: ${planName}\nExpiry: ${exp}\n🔗 ${clone.channelLink}`, parse_mode: "Markdown" });
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

  // 2. ---------------- HANDLE STANDARD TEXT MESSAGES ----------------
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
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✅ *Video File ID ye hai:*\n\n\`${message.video.file_id}\``, parse_mode: "Markdown" });
    } else if (message.photo && message.photo.length > 0) {
      let photoId = message.photo[message.photo.length - 1].file_id;
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✅ *Photo File ID ye hai:*\n\n\`${photoId}\``, parse_mode: "Markdown" });
    } else {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "❌ *Media nahi mila!*\n\nKripya `/getid` likhkar uske sath Photo ya Video send karein.", parse_mode: "Markdown" });
    }
    return;
  }

  if (userState === "waiting_for_admin_demo" && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
    clone.demoVideo = userText; clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "✅ *Free Sample Demo Video successfully updated!*" });
    return;
  }

  if (userState === "waiting_for_admin_upi" && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
    await saveAdminUpi(token, chatId, userText, clone, saveClones, activeClones);
    return;
  }

  // संदेशों को user_handlers.js फ़ाइल पर भेजें
  await handleUserText(token, message, clone, saveClones, activeClones);
}

module.exports = { handleWebhookUpdate };
