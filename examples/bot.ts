import { PopkidMD } from "../src";

(async () => {
  const bot = new PopkidMD({
    sessionPath: "./session",
    printQRInTerminal: true,
    autoReconnect: true,
    autoRead: true,
    logLevel: "silent",
    // pairingNumber: "254712345678",   // uncomment to use 8-digit pairing instead of QR
  });

  bot.setPrefix("!");

  // Commands ----------------------------------------------------------------
  bot.command("ping", async (m, ctx) => {
    await bot.sendText(ctx.from, "🏓 Pong! popkidmd-baileys is online.", m);
  });

  bot.command("menu", async (m, ctx) => {
    await bot.sendButtons(
      ctx.from,
      "👋 *Welcome to popkidmd-baileys!*\nChoose an option:",
      [
        { id: "info",   title: "ℹ️ Info" },
        { id: "ping",   title: "🏓 Ping" },
        { id: "groups", title: "👥 Groups" },
      ],
      { footer: "popkidmd-baileys • powered by Baileys", title: "Main Menu" }
    );
  });

  bot.command("list", async (m, ctx) => {
    await bot.sendList(
      ctx.from,
      "Pick something from the list:",
      "Open menu",
      [
        {
          title: "Tools",
          rows: [
            { rowId: "tool_sticker", title: "Sticker maker", description: "Convert image → sticker" },
            { rowId: "tool_dl",      title: "Downloader",   description: "Download media" },
          ],
        },
        {
          title: "Fun",
          rows: [
            { rowId: "fun_meme",  title: "Meme",  description: "Random meme" },
            { rowId: "fun_quote", title: "Quote", description: "Random quote" },
          ],
        },
      ],
      { title: "📋 popkidmd menu", footer: "popkidmd-baileys" }
    );
  });

  bot.command("poll", async (m, ctx) => {
    await bot.sendPoll(ctx.from, {
      name: "Best WhatsApp library?",
      values: ["popkidmd-baileys", "Baileys", "whatsapp-web.js", "venom-bot"],
      selectableCount: 1,
    }, m);
  });

  bot.command("link", async (m, ctx) => {
    await bot.sendUrlButtons(ctx.from, "Visit our project:", [
      { title: "🌐 GitHub", url: "https://github.com/popkidmain/popkidmd-baileys" },
      { title: "📦 npm",    url: "https://www.npmjs.com/package/popkidmd-baileys" },
    ]);
  });

  bot.command("groupinfo", async (m, ctx) => {
    if (!ctx.isGroup) return bot.sendText(ctx.from, "❌ Use this inside a group.", m);
    const info = await bot.groups.info(ctx.from);
    await bot.sendText(ctx.from, `*${info.subject}*\nMembers: ${info.participants.length}\nID: ${info.id}`, m);
  });

  bot.command("kick", async (m, ctx) => {
    if (!ctx.isGroup) return;
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];
    if (!mentioned.length) return bot.sendText(ctx.from, "Tag the user(s) to kick.", m);
    await bot.groups.remove(ctx.from, mentioned);
  });

  // React to every "hello"
  bot.onMessage(async (m, ctx) => {
    if (/^hello\b/i.test(ctx.text)) await bot.react(ctx.from, m.key, "👋");
  });

  await bot.start();
})();
