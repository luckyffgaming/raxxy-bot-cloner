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
      
      // 🛡️ सपोर्ट बटन पर पैरेंट यूजरनेम हटाकर सीधे ओनर की आईडी का डीप लिंक जोड़ा गया है
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
        if (!clone.premiumUsersList.find(u => u.id === chatId)) clone.premiumUsersList.push({ id: chatId, name: "User", plan: planName, expire: exp });
        saveClones(activeClones);
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: `✨ *PURCHASE SUCCESSFUL* ✨\n\nPlan: ${planName}\nExpiry: ${exp}\n🔗 ${clone.channelLink}`, parse_mode: "Markdown" });
      }
    }
    else if (data === "free_sample") {
      // 🛡️ यहाँ अब बिना किसी फ़ाइल आईडी क्रैश के सीधे प्रीमियम प्रीव्यू लोड होगा
      let demoMsg = "🔥 *FREE SAMPLE PREVIEW* 🔥\n" +
                    "━━━━━━━━━━━━━━━━━━━━━\n" +
                    "Ye hamare premium VIP collection ka ek chota sa preview hai.\n\n" +
                    "💎 *Premium VIP mein kya milega?*\n" +
                    "✅ Full length Ultra HD 4K Videos\n" +
                    "✅ Daily 50+ New Updates\n" +
                    "✅ Private Community Access\n" +
                    "━━━━━━━━━━━━━━━━━━━━━\n" +
                    "👇 *Full access ke liye plan select karein:*";
      let btns = [
        [{ text: "🚀 Buy VIP Membership", callback_data: "/start" }],
        [{ text: "🏠 Main Menu", callback_data: "/start" }]
      ];
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
        chat_id: chatId, photo: "https://i.ibb.co/B5RbHpB9/x.jpg", caption: demoMsg, parse_mode: "Markdown",
        reply_markup: { inline_keyboard: btns }
      });
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

  // 🛡️ फिक्स: यहाँ अब डायरेक्ट डीप लिंक काम करेगा (no hardcoded parent user)
  if (userText === "🎧 Support") {
    let supportMsg = "🎧 *SUPPORT DESK*\n━━━━━━━━━━━━━━━━━━━━━━\nHave issues with payment or activation? Click below to contact our developer team on Telegram:";
    let supportMarkup = {
      inline_keyboard: [
        [{ text: "💬 Contact Owner", url: "tg://user?id=" + clone.adminId }] 
      ]
    };
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId, text: supportMsg, parse_mode: "Markdown",
      reply_markup: supportMarkup
    });
    return;
  }

  // PLANS SHORT TRIGGERS
  if (userText === "plan_desi" || userText === "plan_cornhub" || userText === "plan_onlyfans" || userText === "plan_asian" || userText === "plan_all") {
    let cat = userText.split("_")[1], pr = clone.prices[cat] || "149";
    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, { chat_id: chatId, photo: "https://i.ibb.co/MxTRHgx0/x.jpg", caption: `<b>VIP ${cat.toUpperCase()} Plan</b>\n\nPrice: ₹${pr}`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "⚡ Buy", callback_data: "process_payment " + pr }]] } });
    return;
  }

  // Webhook states
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
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: clone.adminId, text: `💰 *New Deposit Request!*\n\nID: \`${chatId}\`\nAmount: ₹${amt}\nUTR: \`${cleanUtr}\``, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "✅ Approve", callback_data: `approve_fund ${chatId} ${amt}` }, { text: "❌ Reject", callback_data: `reject_pay ${chatId}` }]] } });
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
