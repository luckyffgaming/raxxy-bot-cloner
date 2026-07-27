const axios = require('axios');
const { sendMainMenu, sendAdminPanel } = require('./menu_helpers');
const { handleAdminCallbacks } = require('./admin_handlers');

async function handleWebhookUpdate(token, body, activeClones, saveClones) {
  const clone = activeClones[token];
  if (!clone) return;

  const message = body.message;
  const callbackQuery = body.callback_query;

  if (callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const queryId = callbackQuery.id;

    if (data === "setlang_en" || data === "setlang_hi") {
      let t = data === "setlang_en" ? "Language set to English! 🇺🇸" : "भाषा हिंदी में सेट कर दी गई है! 🇮🇳";
      await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, { callback_query_id: queryId, text: t });
      await sendMainMenu(token, chatId, clone, "✨ " + t);
    }
    else if (data.startsWith("admin_")) {
      await handleAdminCallbacks(token, chatId, data, queryId, clone, saveClones, activeClones);
    }
    else if (data.startsWith("approve_fund ") && chatId.toString() === clone.adminId) {
      let p = data.split(" "), tId = p[1], amt = p[2], old = parseFloat(clone.balances[tId] || "0");
      clone.balances[tId] = (old + parseFloat(amt)).toFixed(2); saveClones(activeClones);
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: `🏦 *DEPOSIT SUCCESSFUL*\n━━━━━━━━━━━━━━━━━━━━━\nYour wallet credited with *₹${amt}*.\n\n💰 Balance: ₹${clone.balances[tId]}`, parse_mode: "Markdown" });
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `Fund Added!` });
    }
    else if (data.startsWith("approve_pay ") && chatId.toString() === clone.adminId) {
      let p = data.split(" "), tId = p[1], amt = p[2], now = new Date();
      now.setDate(now.getDate() + 30); let exp = now.toLocaleDateString(), planName = "Premium VIP Access";
      if (!clone.userPlans) clone.userPlans = {};
      clone.userPlans[tId] = { plan: planName, expire: exp };
      if (!clone.premiumUsersList) clone.premiumUsersList = [];
      if (!clone.premiumUsersList.find(u => u.id === tId)) clone.premiumUsersList.push({ id: tId, name: "User", plan: planName, expire: exp });
      saveClones(activeClones);
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: `✨ *PURCHASE VERIFIED SUCCESSFULLY* ✨\n━━━━━━━━━━━━━━━━━━━━━\n🎉 Payment of *₹${amt}* verified.\n\n📦 *Plan:* ${planName}\n📅 *Expiry:* ${exp}\n🔗 ${clone.channelLink}`, parse_mode: "Markdown", disable_web_page_preview: true });
    }
    else if (data.startsWith("reject_pay ") && chatId.toString() === clone.adminId) {
      let tId = data.split(" ")[1];
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: "❌ Payment Rejected!" });
    }
    else if (data.startsWith("process_payment ")) {
      let amt = data.split(" ")[1];
      if (!clone.userSessions) clone.userSessions = {};
      if (!clone.userSessions[chatId]) clone.userSessions[chatId] = {};
      clone.userSessions[chatId].last_price = amt; saveClones(activeClones);
      let upiLink = `upi://pay?pa=${clone.upiId}&pn=RaxxyDev&am=${amt}&cu=INR`, qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: qrUrl, caption: `🏦 *Pay & Buy*\nAmount: *₹${amt}*\nUPI: \`${clone.upiId}\`\n\nUTR code paste below 👇`, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "💰 Purchase from Wallet", callback_data: "buy_wallet " + amt }], [{ text: "💬 Support", url: "tg://user?id=" + clone.adminId }] ] } });
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
        if (!clone.premiumUsersList.find(u => u.id === chatId)) clone.premiumUsersList.push({ id: chatId, name: "@" + (callbackQuery.from.username || callbackQuery.from.first_name), plan: planName, expire: exp });
        saveClones(activeClones);
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✨ *PURCHASE SUCCESSFUL* ✨\n\nPlan: ${planName}\nExpiry: ${exp}\n🔗 ${clone.channelLink}`, parse_mode: "Markdown" });
      }
    }
    else if (data === "free_sample") {
      let demoMsg = "🔥 *FREE SAMPLE PREVIEW* 🔥\n━━━━━━━━━━━━━━━━━━━━━\nYe hamare premium VIP collection ka ek chota sa preview hai.\n\n💎 *Premium VIP mein kya milega?*\n✅ Full length Ultra HD 4K Videos\n✅ Daily 50+ New Updates\n✅ Private Community Access\n━━━━━━━━━━━━━━━━━━━━━\n👇 *Full access ke liye plan select karein:*";
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: "https://i.ibb.co/B5RbHpB9/x.jpg", caption: demoMsg, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🚀 Buy VIP Membership", callback_data: "/start" }], [{ text: "🏠 Main Menu", callback_data: "/start" }]] } });
    }
    else if (data === "plan_desi" || data === "plan_cornhub" || data === "plan_onlyfans" || data === "plan_asian" || data === "plan_all") {
      let cat = data.split("_")[1], pr = clone.prices[cat] || "149";
      let photo = cat === "desi" ? "https://i.ibb.co/MxTRHgx0/x.jpg" : (cat === "cornhub" ? "https://i.ibb.co/Kx52sLSR/x.jpg" : (cat === "all" ? "https://i.ibb.co/mVkLbvhN/x.jpg" : "https://i.ibb.co/1YNMVKTL/x.jpg"));
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: photo, caption: `<b>VIP ${cat.toUpperCase()} Plan</b>\n\nPrice: ₹${pr}`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "⚡ Buy", callback_data: "process_payment " + pr }], [{ text: "⬅️ Back", callback_data: "/start" }]] } });
    }
    else if (data === "/start") {
      clone.states[chatId] = "none"; saveClones(activeClones);
      await sendMainMenu(token, chatId, clone, "✨ *Main Menu Loaded!*");
    }
    return;
  }

  const chatId = message.chat.id;
  const userText = message.text.trim();
  const userState = clone.states[chatId] || "none";

  if (userText === "/start" || userText === "🛒 Buy Vip Membership") {
    await sendMainMenu(token, chatId, clone, "✨ *Main Menu Loaded!*");
    return;
  }

  if (userText === "💰 Deposit") {
    let bal = clone.balances[chatId] || "0"; clone.states[chatId] = "waiting_for_deposit_amt"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `🏦 *Add Money*\nBalance: ₹${bal}\n\nEnter amount:`, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🏠 Cancel", callback_data: "/start" }]] } });
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
    let supportMarkup = { inline_keyboard: [[{ text: "💬 Contact Owner", url: "tg://user?id=" + clone.adminId }] ] };
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "🎧 *SUPPORT DESK*\n━━━━━━━━━━━━━━━━━━━━━━\nClick below to contact bot owner directly:", parse_mode: "Markdown", reply_markup: supportMarkup });
    return;
  }

  // STATES
  if (userState === "waiting_for_admin_upi" && chatId.toString() === clone.adminId) {
    clone.upiId = userText; clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "✅ *UPI ID updated to:* `" + userText + "`", parse_mode: "Markdown" });
    return;
  }
  if (userState === "waiting_for_channel_link" && chatId.toString() === clone.adminId) {
    clone.channelLink = userText; clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "✅ Success Link updated" });
    return;
  }
  if (userState === "waiting_for_fund_input" && chatId.toString() === clone.adminId) {
    let p = userText.split(" "), tId = p[0], amt = parseFloat(p[1]);
    if (!tId || isNaN(amt)) return;
    let cur = parseFloat(clone.balances[tId] || "0");
    clone.balances[tId] = (cur + amt).toFixed(2); clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✅ ₹${amt} added` });
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: tId, text: `🎁 Admin added ₹${amt}!` });
    return;
  }
  if (userState === "waiting_for_price_input" && chatId.toString() === clone.adminId) {
    let p = userText.split(" "), cat = p[0].toLowerCase(), pr = p[1];
    if (!clone.prices) clone.prices = {};
    clone.prices[cat] = pr; clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✅ Price updated` });
    return;
  }
  if (userState === "waiting_for_fake_count" && chatId.toString() === clone.adminId) {
    clone.fakeUsers = userText; clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "✅ Fake users updated" });
    return;
  }
  if (userState === "waiting_for_broadcast_text" && chatId.toString() === clone.adminId) {
    clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "🚀 Broadcast initiated..." });
    for (let uId of clone.userList) {
      try { await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: uId, text: `📣 *BROADCAST FROM ADMIN*\n━━━━━━━━━━━━━━━━━━━━━\n${userText}`, parse_mode: "Markdown" }); } catch (e) {}
    }
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "✅ Broadcast completed!" });
    return;
  }
  if (userState === "waiting_for_expire_id" && chatId.toString() === clone.adminId) {
    let tId = userText;
    if (clone.premiumUsersList) clone.premiumUsersList = clone.premiumUsersList.filter(u => u.id !== tId);
    if (clone.userPlans) delete clone.userPlans[tId];
    clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✅ User \`${tId}\` removed.` });
    return;
  }
  if (userState === "waiting_for_deposit_amt") {
    let amount = parseInt(userText);
    if (isNaN(amount) || amount < 1) return;
    if (!clone.userSessions) clone.userSessions = {};
    if (!clone.userSessions[chatId]) clone.userSessions[chatId] = {};
    clone.userSessions[chatId].last_dep_amt = amount.toString();
    clone.states[chatId] = "waiting_for_deposit_utr"; saveClones(activeClones);
    let qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${clone.upiId}&am=${amount}`)}`;
    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: qr, caption: `🏦 *Deposit Request*\nAmount: *₹${amount}*\n\nReply with *UTR* code 👇`, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "tg://user?id=" + clone.adminId }, { text: "🏠 Cancel", callback_data: "/start" }]] } });
    return;
  }
  if (userState === "waiting_for_deposit_utr") {
    let cleanUtr = userText.replace(/[^0-9]/g, "");
    if (cleanUtr.length !== 12) return;
    let amount = (clone.userSessions && clone.userSessions[chatId]) ? clone.userSessions[chatId].last_dep_amt : "100";
    clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "⏳ *Verifying...*" });
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: clone.adminId, text: `💰 *New Deposit Request!*\n\nID: \`${chatId}\`\nAmount: ₹${amount}\nUTR: \`${cleanUtr}\``, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "✅ Approve", callback_data: `approve_fund ${chatId} ${amount}` }, { text: "❌ Reject", callback_data: `reject_pay ${chatId}` }]] } });
    return;
  }
  if (userState === "waiting_for_utr_input") {
    let cleanUtr = userText.replace(/[^0-9]/g, "");
    if (cleanUtr.length !== 12) return;
    let amount = (clone.userSessions && clone.userSessions[chatId]) ? clone.userSessions[chatId].last_price : "149";
    clone.states[chatId] = "none"; saveClones(activeClones);
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: "⏳ *Verifying...*" });
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: clone.adminId, text: `🔔 *New Purchase Request!*\n\nID: \`${chatId}\`\nAmount: ₹${amt}\nUTR: \`${cleanUtr}\``, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "✅ Approve Buy", callback_data: `approve_pay ${chatId} ${amt}` }, { text: "❌ Reject", callback_data: `reject_pay ${chatId}` }]] } });
    return;
  }
}

module.exports = { handleWebhookUpdate };
