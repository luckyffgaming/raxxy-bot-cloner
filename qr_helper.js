const axios = require('axios');

function generateQrUrl(upiId, amount, name = "RaxxyDev") {
  let upiLink = "upi://pay?pa=" + upiId + "&pn=" + encodeURIComponent(name) + "&am=" + amount + "&cu=INR";
  return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(upiLink);
}

function getQrCaption(amount, upiId) {
  // 🛡️ आपके कोड के अनुसार हुबहू ओरिजिनल HTML टेक्स्ट फ़ॉर्मेट
  return "🏦 <b>Pay & Buy Plan</b>\n\n" +
         "💰 Amount: <b>₹" + amount + "</b>\n" +
         "🆔 UPI ID: <code>" + upiId + "</code>\n\n" +
         "1️⃣ Is QR ko scan karein, ₹" + amount + " apne aap fill ho jayega.\n" +
         "2️⃣ Payment ke baad 12-digit UTR niche bhej dein 👇";
}

module.exports = { generateQrUrl, getQrCaption };
