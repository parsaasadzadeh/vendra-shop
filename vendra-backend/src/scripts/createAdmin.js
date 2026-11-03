// ساخت ادمین (فقط از طریق سرور/ترمینال؛ هیچ API عمومی برای ساخت ادمین وجود ندارد)
//
//   node src/scripts/createAdmin.js <username>             ← ساخت ادمین جدید
//   node src/scripts/createAdmin.js <username> --reset     ← تغییر رمز ادمین موجود (همه‌ی نشست‌هایش باطل می‌شود)
//
// رمز عبور به‌صورت مخفی از ترمینال پرسیده می‌شود (یا از متغیر ADMIN_PASSWORD).
require("dotenv").config();
const readline = require("readline");
const mongoose = require("mongoose");
const Admin = require("../models/admin.model");
const { hashPassword, assertStrongPassword } = require("../utils/password");

const ask = (question, { hidden = false } = {}) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
    if (hidden && process.stdin.isTTY) {
      process.stdout.write(question);
      rl._writeToOutput = () => {}; // چیزی که تایپ می‌شود نمایش داده نشود
      rl.question("", (answer) => {
        rl.close();
        process.stdout.write("\n");
        resolve(answer);
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });

const run = async () => {
  const username = String(process.argv[2] || "").trim().toLowerCase();
  const reset = process.argv.includes("--reset");

  if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
    console.error("Usage: node src/scripts/createAdmin.js <username> [--reset]");
    console.error("username: 3-40 chars, a-z 0-9 . _ -");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined");
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await ask("Password (min 12 chars, letters + digits): ", { hidden: true });
    const again = await ask("Repeat password: ", { hidden: true });
    if (password !== again) {
      console.error("Passwords do not match");
      process.exit(1);
    }
  }
  assertStrongPassword(password, username);
  const passwordHash = await hashPassword(password);

  await mongoose.connect(uri);
  const existing = await Admin.findOne({ username });

  if (existing && !reset) {
    console.error(`Admin "${username}" already exists. Use --reset to change the password.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.tokenVersion += 1;
    existing.failedLoginAttempts = 0;
    existing.lockUntil = null;
    existing.isActive = true;
    await existing.save();
    console.log(`OK: password for "${username}" was reset and all old sessions were revoked`);
  } else {
    await Admin.create({ username, passwordHash });
    console.log(`OK: admin "${username}" created`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
