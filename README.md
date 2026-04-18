# popkidmd-baileys

> A powerful, modern WhatsApp Web API library built on top of [Baileys](https://github.com/WhiskeySockets/Baileys).
> Full support for **interactive buttons, lists, polls, groups, reactions, media, presence, edit/delete and the latest WhatsApp updates**.

[![npm](https://img.shields.io/npm/v/popkidmd-baileys)](https://www.npmjs.com/package/popkidmd-baileys)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ Features

- 🔘 **Interactive buttons** (quick-reply, URL, call) — works on the latest WhatsApp clients
- 📋 **List messages** with sections & rows
- 📊 **Polls** (single & multi-choice)
- 👥 **Full group management** — create, add, remove, promote, demote, settings, invite links
- 🖼️ **Media**: image, video, audio (PTT), document, sticker
- 📍 Location, 📇 contacts, 😀 reactions, ✏️ edit, 🗑️ delete, ↩️ forward
- 📱 **QR or 8-digit pairing code** login
- 🔁 Auto-reconnect, presence, multi-file auth state
- ⚡ Built-in **command system** with prefix
- 🧠 TypeScript first, full type definitions

## 📦 Install

```bash
npm install popkidmd-baileys
```

## 🚀 Quick start

```ts
import { PopkidMD } from "popkidmd-baileys";

const bot = new PopkidMD({ sessionPath: "./session", autoReconnect: true });

bot.command("ping", async (m, ctx) => {
  await bot.sendText(ctx.from, "🏓 Pong!", m);
});

bot.command("menu", async (m, ctx) => {
  await bot.sendButtons(ctx.from, "Pick one:", [
    { id: "a", title: "Option A" },
    { id: "b", title: "Option B" },
  ], { footer: "popkidmd-baileys" });
});

await bot.start();
```

Scan the QR shown in the terminal with **WhatsApp → Linked Devices**.

### Pairing code (no QR)
```ts
const bot = new PopkidMD({ pairingNumber: "254712345678" });
await bot.start(); // prints an 8-digit code to enter on your phone
```

## 🔘 Buttons & Lists

```ts
// Quick-reply buttons
await bot.sendButtons(jid, "Choose:", [
  { id: "yes", title: "✅ Yes" },
  { id: "no",  title: "❌ No"  },
]);

// URL buttons
await bot.sendUrlButtons(jid, "Links:", [{ title: "GitHub", url: "https://github.com" }]);

// Call buttons
await bot.sendCallButtons(jid, "Call us:", [{ title: "Support", phone: "+254712345678" }]);

// List
await bot.sendList(jid, "Pick:", "Open", [
  { title: "Tools", rows: [{ rowId: "t1", title: "Sticker", description: "Make sticker" }] },
]);
```

## 👥 Groups

```ts
await bot.groups.create("My Group", ["254712345678", "254799999999"]);
await bot.groups.add(groupJid, ["254700000000"]);
await bot.groups.promote(groupJid, ["254700000000"]);
await bot.groups.setMessaging(groupJid, "announcement"); // only admins can chat
const link = await bot.groups.invite(groupJid);
console.log("Invite:", `https://chat.whatsapp.com/${link}`);
```

## 🖼️ Media

```ts
await bot.sendMedia(jid, "image",    "https://picsum.photos/600", { caption: "Hi" });
await bot.sendMedia(jid, "video",    Buffer.from(...), { caption: "GIF", gifPlayback: true });
await bot.sendMedia(jid, "audio",    "./voice.ogg", { ptt: true });
await bot.sendMedia(jid, "document", "./report.pdf", { fileName: "report.pdf", mimetype: "application/pdf" });
```

## 📊 Polls, ✏️ Edit, 🗑️ Delete, 😀 React

```ts
await bot.sendPoll(jid, { name: "Pizza?", values: ["Yes", "No"], selectableCount: 1 });
await bot.react(jid, m.key, "🔥");
await bot.edit(jid, sentMsg.key, "edited!");
await bot.deleteMessage(jid, sentMsg.key);
```

## 🛠️ Run the example

```bash
git clone https://github.com/popkid/popkidmd-baileys.git
cd popkidmd-baileys
npm install
npm run dev          # starts examples/bot.ts and prints QR
```

## 🌍 Deploy 24/7

| Host | How |
|---|---|
| **Railway** | Push to GitHub → New Project → Deploy from repo → start command `npm start` |
| **Render**  | New Background Worker → start command `npm start` |
| **VPS / Heroku** | `npm install && npm run build && pm2 start dist/examples/bot.js` |

⚠️ Always persist the `session/` folder (volume mount on Railway/Render) so you don't have to re-scan QR.

## 📤 Publish your own fork to npm

```bash
npm login
npm version patch
npm publish --access public
```

## 📜 License

MIT © Popkid
