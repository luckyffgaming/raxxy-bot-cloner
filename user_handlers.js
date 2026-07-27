const axios = require('axios');
const { sendMainMenu, sendAdminPanel } = require('./menu_helpers');

async function handleUserText(token, message, clone, saveClones, activeClones) {
  const chatId = message.chat.id;
  const userText = message.text ? message.text.trim() : "";
  const userState = clone.states[chatId] || "none";

  if (!clone.userList) clone.userList = [];
  if (!clone.userList.includes(chatId.toString())) {
    clone.userList.push(chatId.toString());
    saveClones(activeClones);
  }

  if (userText === "/admin" || userText === "admin") {
    if (chatId.toString() !== clone.adminId) {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "❌ Authorized Admin Only!" });
    } else {
      await sendAdminPanel(token, chatId, clone);
    }
    return;
  }

  if (userText === "/start" || userText === "🛒 Buy Vip Membership") {
    if (!clone.notifiedAdmin) clone.notifiedAdmin = {};
    if (clone.notifiedAdmin[chatId] !== "done") {
      try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: clone.adminId, text: `🆕 *New User Alert!*\n\n👤 Name: ${message.from.first_name}\n🆔 ID: \`${chatId}\`\n🔗 User: @${message.from.username || "None"}`, parse_mode: "Markdown" });
        clone.notifiedAdmin[chatId] = "done"; saveClones(activeClones);
      } catch (e) {}
    }
    await sendMainMenu(token, chatId, clone, "✨ *Main Menu Loaded!*");
    return;
  }

  if (userText === "💰 Deposit") {
    let bal = clone.balances[chatId] || "0"; clone.states[chatId] = "waiting_for_deposit_amt"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `🏦 *Add Money to Wallet*\n\n👛 *Current balance:* ₹${bal}\n\nEnter the amount to deposit (₹1 – ₹100000).\nSend the number only, e.g. 100.`, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "💬 Support", url: "tg://user?id=" + clone.adminId }], [{ text: "🏠 Cancel", callback_data: "/start" }]] } });
    return;
  }

  if (userText === "👤 My profile") {
    let bal = clone.balances[chatId] || "0", planObj = clone.userPlans ? clone.userPlans[chatId] : null, plan = planObj ? planObj.plan : "No active plan", expire = planObj ? planObj.expire : "N/A", status = (plan === "No active plan") ? "Inactive ❌" : "Active 🔓";
    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: "https://i.ibb.co/B5RbHpB9/x.jpg", caption: `👤 *Profile Details*\n\n🤑 *User:* @${message.from.username || message.from.first_name}\n🆔 *User ID:* \`${chatId}\`\n✨ *Plan:* ${plan}\n📅 *Expiry Date:* ${expire}\n✅ *Status:* ${status}\n\n👛 *Wallet Balance:* ₹${bal}\n\n⏰ ${new Date().toLocaleString()} UTC`, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🏠 Back", callback_data: "/start" }]] } });
    return;
  }

  if (userText === "🌐 Language") {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "💬 *Language*", reply_markup: { inline_keyboard: [[{ text: "English", callback_data: "setlang_en" }, { text: "Hindi", callback_data: "setlang_hi" }], [{ text: "🏠 Back", callback_data: "/start" }]] } });
    return;
  }

  if (userText === "🎧 Support") {
    let supportMsg = "🎧 *SUPPORT DESK*\n━━━━━━━━━━━━━━━━━━━━━━\nHave issues with payment or activation? Click below to contact our developer team on Telegram:";
    let supportMarkup = { inline_keyboard: [[{ text: "💬 Contact Owner", url: "tg://user?id=" + clone.adminId }]] };
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: supportMsg, parse_mode: "Markdown", reply_markup: supportMarkup });
    return;
  }

  // PLANS SHORT TRIGGERS
  if (userText === "plan_desi" || userText === "plan_cornhub" || userText === "plan_onlyfans" || userText === "plan_asian" || userText === "plan_all") {
    let cat = userText.split("_")[1], pr = clone.prices[cat] || "149";
    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: "https://i.ibb.co/MxTRHgx0/x.jpg", caption: `<b>VIP ${cat.toUpperCase()} Plan</b>\n\nPrice: ₹${pr}`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "⚡ Buy", callback_data: "process_payment " + pr }], [{ text: "⬅️ Back", callback_data: "/start" }]] } });
    return;
  }

  // Webhook states
  if (userState === "waiting_for_deposit_amt") {
    let amount = parseInt(userText);
    if (isNaN(amount) || amount < 1) {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "❌ Send numeric value only (Example: 500):" });
      return;
    }
    if (!clone.userSessions) clone.userSessions = {};
    if (!clone.userSessions[chatId]) clone.userSessions[chatId] = {};
    clone.userSessions[chatId].last_dep_amt = amount.toString();
    clone.states[chatId] = "waiting_for_deposit_utr"; saveClones(activeClones);
    let qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${clone.upiId}&am=${amount}`)}`;
    
    // 🛡️ फिक्स: यहाँ डिपॉजिट रसीद और क्यूआर कोड आपके पुराने स्टाइल में कस्टमाइज्ड कर दिया गया है
    let qrText = `🏦 *Deposit Request*\n\n` +
                 `💰 Amount: *₹${amount}*\n` +
                 `🆔 UPI ID: \`${clone.upiId}\`\n\n` +
                 `1️⃣ Is QR ko scan karein, ₹${amount} apne aap fill ho jayega.\n` +
                 `2️⃣ Payment ke baad 12-digit UTR niche bhej dein 👇`;

    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: qr, caption: qrText, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "💬 Support", url: "tg://user?id=" + clone.adminId }, { text: "🏠 Cancel", callback_data: "/start" }]] } });
    return;
  }

  if (userState === "waiting_for_deposit_utr") {
    let cleanUtr = userText.replace(/[^0-9]/g, "");
    if (cleanUtr.length !== 12) {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "❌ Invalid UTR format. Re-enter 12-digit confirmation code:" });
      return;
    }
    let amount = (clone.userSessions && clone.userSessions[chatId]) ? clone.userSessions[chatId].last_dep_amt : "100";
    clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "⏳ *Verifying...*" });
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: clone.adminId, text: `💰 *New Deposit Request!*\n\nID: \`${chatId}\`\nAmount: ₹${amt}\nUTR: \`${cleanUtr}\``, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "✅ Approve", callback_data: `approve_fund ${chatId} ${amt}` }, { text: "❌ Reject", callback_data: `reject_pay ${chatId}` }]] } });
    return;
  }

  if (userState === "waiting_for_utr_input") {
    let cleanUtr = userText.replace(/[^0-9]/g, "");
    if (cleanUtr.length !== 12) {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "❌ Invalid UTR. Re-enter correctly:" });
      return;
    }
    let amount = (clone.userSessions && clone.userSessions[chatId]) ? clone.userSessions[chatId].last_price : "149";
    clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "⏳ *Verifying...*" });
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: clone.adminId, text: `🔔 *New Purchase Request!*\n\nID: \`${chatId}\`\nAmount: ₹${amount}\nUTR: \`${cleanUtr}\``, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "✅ Approve Buy", callback_data: `approve_pay ${chatId} ${amount}` }, { text: "❌ Reject", callback_data: `reject_pay ${chatId}` }]] } });
    return;
  }

  // 🛡️ फिक्स: एडमिन ब्रॉडकास्ट सिस्टम (फोटो, वीडियो और टेक्स्ट तीनों को सपोर्ट करेगा)
  if (userState === "waiting_for_broadcast_text" && chatId.toString() === clone.adminId) {
    clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "🚀 *Broadcast initiated...*" });

    for (let uId of clone.userList) {
      try {
        if (message.photo && message.photo.length > 0) {
          let photoId = message.photo[message.photo.length - 1].file_id;
          await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: uId, photo: photoId, caption: userText || "", parse_mode: "Markdown" });
        } else if (message.video) {
          await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, { chat_id: uId, video: message.video.file_id, caption: userText || "", parse_mode: "Markdown" });
        } else {
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: uId, text: userText, parse_mode: "Markdown" });
        }
      } catch (e) {}
    }
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "✅ *Broadcast completed successfully!*" });
    return;
  }
}

module.exports = { handleUserText };
