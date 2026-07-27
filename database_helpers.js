const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, 'clones.json');

function loadClones() {
  if (!fs.existsSync(DB_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { return {}; }
}

function saveClones(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Error writing to DB file:", e.message);
  }
}

module.exports = { loadClones, saveClones };
