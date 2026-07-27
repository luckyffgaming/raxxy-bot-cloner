const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { handleWebhookUpdate } = require('./bot_handlers');
const app = express();
app.use(express.json());

const DB_FILE = path.join(__dirname, 'clones.json');

function loadClones() {
  if (!fs.existsSync(DB_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { return {}; }
}

function saveClones(data) {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (e) {}
}

let activeClones = loadClones();

app.get('/', (req, res) => {
  res.send("🟢 Raxxy Dev Cloner Engine is Online & Live!");
});

app.post('/api/deploy', async (req, res) => {
  const { token, admin_id, bot_username, buyer_name, order_id, bot_model } = req.body;
  if (!token || !admin_id) return res.status(400).json({ status: "failed" });

  activeClones = loadClones();
  activeClones[token] = {
    adminId: admin_id.toString(), botUsername: bot_username, buyerName: buyer_name, orderId: order_id, botModel: bot_model,
    channelLink: "https://t.me/RAXYY_LABS", upiId: "anshxlucky@fam", fakeUsers: "0",
    prices: { desi: "149", cornhub: "99", onlyfans: "149", asian: "150", all: "399" },
    userList: [], premiumUsersList: [], balances: {}, userPlans: {}, notifiedAdmin: {}, states: {}, userSessions: {}
  };
  saveClones(activeClones);

const serverUrl = "https://raxxy-bot-cloner-1.onrender.com";
  try {
    await axios.get(`https://api.telegram.org/bot${token}/setWebhook?url=${serverUrl}/webhook/${token}`);
    return res.json({ status: "success" });
  } catch (error) {
    return res.status(500).json({ status: "failed", error: error.message });
  }
});

app.post('/webhook/:token', async (req, res) => {
  activeClones = loadClones();
  await handleWebhookUpdate(req.params.token, req.body, activeClones, saveClones);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server live on port ${PORT}`); });
