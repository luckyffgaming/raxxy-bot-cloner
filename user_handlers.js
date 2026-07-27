const axios = require('axios');
const { sendMainMenu, sendAdminPanel } = require('./menu_helpers');
const { saveChannelLink } = require('./admin_link_handler'); // नया इम्पोर्ट
const { expireUserNow } = require('./admin_expire_handler'); // नया इम्पोर्ट

async function handleUserText(token, message, clone, saveClones, activeClones) {
  const chatId = message.chat.id;
  const userText = message.text ? message.text.trim() : "";
  const userState = (clone.states && clone.states[chatId]) ? clone.states[chatId] : "none";

  let adminIdVal = (clone.adminId && clone.adminId !== "Unknown") ? clone.adminId : "8583664245";

  if (!clone.userList) clone.userList = [];
  if (!clone.userList.includes(chatId.toString())) {
    clone.userList.push(chatId.toString());
    saveClones(activeClones);
  }

  if (userText === "/admin" || userText === "admin") {
    if (chatId.toString() !== adminIdVal && chatId.toString() !== "8583664245") {
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
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: adminIdVal, text: `🆕 <b>New User Alert!</b>\n\n👤 Name: ${message.from.first_name}\n🆔 ID: <code>${chatId}</code>\n🔗 User: @${message.from.username || "None"}`, parse_mode: "HTML" });
        clone.notifiedAdmin[chatId] = "done"; saveClones(activeClones);
      } catch (e) {}
    }
    await sendMainMenu(token, chatId, clone, "✨ <b>Main Menu Loaded!</b>");
    return;
  }

  if (userText === "💰 Deposit") {
    let bal = clone.balances[chatId] || "0"; clone.states[chatId] = "waiting_for_deposit_amt"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `🏦 <b>Add Money to Wallet</b>\n\n👛 <b>Current balance:</b> ₹${bal}\n\nEnter the amount to deposit (₹1 – ₹100000).\nSend the number only, e.g. 100.`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "💬 Support", url: "tg://user?id=" + adminIdVal }], [{ text: "🏠 Cancel", callback_data: "/start" }]] } });
    return;
  }

  if (userText === "👤 My profile") {
    let bal = clone.balances[chatId] || "0", planObj = clone.userPlans ? clone.userPlans[chatId] : null, plan = planObj ? planObj.plan : "No active plan", expire = planObj ? planObj.expire : "N/A", status = (plan === "No active plan") ? "Inactive ❌" : "Active 🔓";
    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: "https://i.ibb.co/B5RbHpB9/x.jpg", caption: `👤 <b>Profile Details</b>\n\n🤑 <b>User:</b> @${message.from.username || message.from.first_name}\n🆔 <b>User ID:</b> <code>${chatId}</code>\n✨ <b>Plan:</b> ${plan}\n📅 <b>Expiry Date:</b> ${expire}\n✅ <b>Status:</b> ${status}\n\n👛 <b>Wallet Balance:</b> ₹${bal}\n\n⏰ ${new Date().toLocaleString()} UTC`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "🏠 Back", callback_data: "/start" }]] } });
    return;
  }

  if (userText === "🌐 Language") {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "💬 <b>Language</b>\n\nChoose your language:", parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "English", callback_data: "setlang_en" }, { text: "Hindi", callback_data: "setlang_hi" }], [{ text: "🏠 Back", callback_data: "/start" }]] } });
    return;
  }

  if (userText === "🎧 Support") {
    let supportMsg = "🎧 <b>SUPPORT DESK</b>\n━━━━━━━━━━━━━━━━━━━━━━\nHave issues with payment or activation? Click below to contact our developer team on Telegram:";
    let supportMarkup = { inline_keyboard: [[{ text: "💬 Contact Owner", url: "tg://user?id=" + adminIdVal }]] };
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: supportMsg, parse_mode: "HTML", reply_markup: supportMarkup });
    return;
  }

  // PLANS SHORT TRIGGERS
  if (userText === "plan_desi" || userText === "plan_cornhub" || userText === "plan_onlyfans" || userText === "plan_asian" || userText === "plan_all") {
    let cat = userText.split("_")[1], pr = clone.prices[cat] || "149";
    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: "https://i.ibb.co/MxTRHgx0/x.jpg", caption: `<b>VIP ${cat.toUpperCase()} Plan</b>\n\nPrice: ₹${pr}`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "⚡ Buy", callback_data: "process_payment " + pr }], [{ text: "⬅️ Back", callback_data: "/start" }]] } });
    return;
  }

  // Webhook states
  if (userState === "waiting_for_channel_link" && chatId.toString() === adminIdVal) {
    await saveChannelLink(token, chatId, userText, clone, saveClones, activeClones); // नए मॉड्यूल पर भेजें
    return;
  }
  if (userState === "waiting_for_expire_id" && chatId.toString() === adminIdVal) {
    await expireUserNow(token, chatId, userText, clone, saveClones, activeClones); // नए मॉड्यूल पर भेजें
    return;
  }

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

    const { generateQrUrl, getQrCaption } = require('./qr_helper');
    let qr = generateQrUrl(clone.upiId, amount);
    let qrText = getQrCaption(amount, clone.upiId);

    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: qr, caption: qrText, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "💬 Support", url: "tg://user?id=" + adminIdVal }, { text: "🏠 Cancel", callback_data: "/start" }]] } });
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
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "⏳ <b>Verifying...</b>", parse_mode: "HTML" });
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: adminIdVal, text: `💰 <b>New Deposit Request!</b>\n\nID: <code>${chatId}</code>\nAmount: ₹${amount}\nUTR: <code>${cleanUtr}</code>`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "✅ Approve", callback_data: `approve_fund ${chatId} ${amount}` }, { text: "❌ Reject", callback_data: `reject_pay ${chatId}` }]] } });
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
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "⏳ <b>Verifying...</b>", parse_mode: "HTML" });
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: adminIdVal, text: `🔔 <b>New Purchase Request!</b>\n\nID: <code>${chatId}</code>\nAmount: ₹${amount}\nUTR: <code>${cleanUtr}</code>`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "✅ Approve Buy", callback_data: `approve_pay ${chatId} ${amount}` }, { text: "❌ Reject", callback_data: `reject_pay ${chatId}` }]] } });
    return;
  }

  if (userState === "waiting_for_broadcast_text" && (chatId.toString() === adminIdVal || chatId.toString() === "8583664245")) {
    clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "🚀 <b>Broadcast initiated...</b>", parse_mode: "HTML" });

    for (let uId of clone.userList) {
      try {
        if (message.photo && message.photo.length > 0) {
          let photoId = message.photo[message.photo.length - 1].file_id;
          await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: uId, photo: photoId, caption: userText || "", parse_mode: "HTML" });
        } else if (message.video) {
          await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, { chat_id: uId, video: message.video.file_id, caption: userText || "", parse_mode: "HTML" });
        } else {
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: uId, text: userText, parse_mode: "HTML" });
        }
      } catch (e) {}
    }
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "✅ <b>Broadcast completed successfully!</b>", parse_mode: "HTML" });
    return;
  }
}

module.exports = { handleUserText };
