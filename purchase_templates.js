function getPurchaseInvoice(price, planName, expStr, channelLink) {
  // 🛡️ आपके कोड के अनुसार हुबहू ओरिजिनल HTML टेक्स्ट फ़ॉर्मेट
  return "✨ <b>PURCHASE VERIFIED SUCCESSFULLY</b> ✨\n" +
         "━━━━━━━━━━━━━━━━━━━━━\n" +
         "🎉 <b>Congratulations!</b> Payment of <b>₹" + price + "</b> verified.\n\n" +
         "📦 <b>Plan:</b> " + planName + "\n" +
         "📅 <b>Expiry:</b> " + expStr + "\n" +
         "✅ <b>Status:</b> Active 🔓\n" +
         "━━━━━━━━━━━━━━━━━━━━━\n" +
         "👇 <b>ACCESS YOUR CONTENT HERE:</b>\n" +
         "🔗 " + channelLink + "\n\n" +
         "<i>Join this channel and enjoy 🤤</i>";
}

module.exports = { getPurchaseInvoice };
