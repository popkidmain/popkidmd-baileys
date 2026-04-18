import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  WASocket,
  Browsers,
  makeCacheableSignalKeyStore,
  proto,
  WAMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import P from "pino";
import qrcode from "qrcode-terminal";
import NodeCache from "node-cache";
import { PopkidOptions, MessageHandler, QuickReplyButton, UrlButton, CallButton, ListSection, PollOptions } from "./types";
import { extractText, isGroupJid, sleep, toJid } from "./utils";
import * as msgs from "./messages";
import * as groups from "./groups";

export class PopkidMD {
  public sock!: WASocket;
  private opts: Required<Omit<PopkidOptions, "pairingNumber">> & { pairingNumber?: string };
  private logger: ReturnType<typeof P>;
  private msgCache = new NodeCache({ stdTTL: 60 * 5 });
  private handlers: MessageHandler[] = [];
  private commands = new Map<string, MessageHandler>();
  private prefix = "!";

  constructor(opts: PopkidOptions = {}) {
    this.opts = {
      sessionPath: opts.sessionPath ?? "./popkid_session",
      printQRInTerminal: opts.printQRInTerminal ?? true,
      logLevel: opts.logLevel ?? "silent",
      browser: opts.browser ?? Browsers.macOS("Chrome"),
      autoRead: opts.autoRead ?? false,
      alwaysOnline: opts.alwaysOnline ?? false,
      autoReconnect: opts.autoReconnect ?? true,
      pairingNumber: opts.pairingNumber,
    };
    this.logger = P({ level: this.opts.logLevel });
  }

  /** Set command prefix (default "!") */
  setPrefix(p: string) { this.prefix = p; return this; }

  /** Register a command handler: bot.command("ping", async (m, ctx)=> ...) */
  command(name: string, handler: MessageHandler) {
    this.commands.set(name.toLowerCase(), handler);
    return this;
  }

  /** Register a generic message handler */
  onMessage(handler: MessageHandler) { this.handlers.push(handler); return this; }

  /** Start / connect */
  async start(): Promise<WASocket> {
    const { state, saveCreds } = await useMultiFileAuthState(this.opts.sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    this.logger.info({ version, isLatest }, "[popkidmd] using WA version");

    this.sock = makeWASocket({
      version,
      logger: this.logger as any,
      printQRInTerminal: false,
      browser: this.opts.browser,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.logger as any),
      },
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: this.opts.alwaysOnline,
      msgRetryCounterCache: this.msgCache,
      getMessage: async () => ({ conversation: "popkidmd-baileys" }),
    });

    // Pairing code flow
    if (this.opts.pairingNumber && !this.sock.authState.creds.registered) {
      await sleep(3000);
      const code = await this.sock.requestPairingCode(this.opts.pairingNumber.replace(/\D/g, ""));
      console.log(`\n[popkidmd] 🔑 Pairing code: ${code}\nEnter it on WhatsApp → Linked Devices → Link with phone number.\n`);
    }

    this.sock.ev.on("creds.update", saveCreds);
    this.sock.ev.on("connection.update", (u) => this.handleConnection(u));
    this.sock.ev.on("messages.upsert", (u) => this.handleMessages(u));

    return this.sock;
  }

  private handleConnection(u: any) {
    const { connection, lastDisconnect, qr } = u;
    if (qr && this.opts.printQRInTerminal) {
      console.log("\n[popkidmd] 📱 Scan the QR below with WhatsApp → Linked Devices:\n");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      console.log(`[popkidmd] ✅ connected as ${this.sock.user?.id}`);
    } else if (connection === "close") {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(`[popkidmd] ❌ disconnected (code ${code}). loggedOut=${loggedOut}`);
      if (this.opts.autoReconnect && !loggedOut) {
        setTimeout(() => this.start().catch(e => console.error("[popkidmd] reconnect failed", e)), 2000);
      }
    }
  }

  private async handleMessages(u: { messages: WAMessage[]; type: string }) {
    for (const m of u.messages) {
      if (!m.message) continue;
      if (m.key.fromMe) continue;
      const from = m.key.remoteJid!;
      const text = extractText(m).trim();
      const ctx = { from, text, isGroup: isGroupJid(from) };

      if (this.opts.autoRead) await this.sock.readMessages([m.key]);

      // Command dispatch
      if (text.startsWith(this.prefix)) {
        const [cmd, ...rest] = text.slice(this.prefix.length).split(/\s+/);
        const handler = this.commands.get(cmd.toLowerCase());
        if (handler) {
          try { await handler(m, { ...ctx, text: rest.join(" ") }); }
          catch (e) { console.error(`[popkidmd] command "${cmd}" error:`, e); }
          continue;
        }
      }

      // Generic handlers
      for (const h of this.handlers) {
        try { await h(m, ctx); } catch (e) { console.error("[popkidmd] handler error:", e); }
      }
    }
  }

  // ─── Convenience proxies ──────────────────────────────────────────────
  sendText      = (jid: string, text: string, quoted?: proto.IWebMessageInfo) => msgs.sendText(this.sock, jid, text, quoted);
  sendMedia     = (jid: string, type: "image"|"video"|"audio"|"document"|"sticker", source: string|Buffer, opts?: any, quoted?: proto.IWebMessageInfo) => msgs.sendMedia(this.sock, jid, type, source, opts, quoted);
  sendButtons   = (jid: string, body: string, buttons: QuickReplyButton[], opts?: any) => msgs.sendButtons(this.sock, jid, body, buttons, opts);
  sendUrlButtons= (jid: string, body: string, buttons: UrlButton[], opts?: any) => msgs.sendUrlButtons(this.sock, jid, body, buttons, opts);
  sendCallButtons=(jid: string, body: string, buttons: CallButton[], opts?: any) => msgs.sendCallButtons(this.sock, jid, body, buttons, opts);
  sendList      = (jid: string, body: string, buttonText: string, sections: ListSection[], opts?: any) => msgs.sendList(this.sock, jid, body, buttonText, sections, opts);
  sendPoll      = (jid: string, poll: PollOptions, quoted?: proto.IWebMessageInfo) => msgs.sendPoll(this.sock, jid, poll, quoted);
  sendContact   = (jid: string, c: { fullName: string; phone: string; org?: string }) => msgs.sendContact(this.sock, jid, c);
  sendLocation  = (jid: string, lat: number, lng: number, name?: string, address?: string) => msgs.sendLocation(this.sock, jid, lat, lng, name, address);
  react         = (jid: string, key: proto.IMessageKey, emoji: string) => msgs.react(this.sock, jid, key, emoji);
  forward       = (jid: string, m: proto.IWebMessageInfo) => msgs.forward(this.sock, jid, m);
  edit          = (jid: string, key: proto.IMessageKey, newText: string) => msgs.editMessage(this.sock, jid, key, newText);
  deleteMessage = (jid: string, key: proto.IMessageKey) => msgs.deleteMessage(this.sock, jid, key);

  // Presence
  setPresence(jid: string, presence: "available"|"unavailable"|"composing"|"recording"|"paused") {
    return this.sock.sendPresenceUpdate(presence, toJid(jid));
  }
  updateProfileName    = (name: string) => this.sock.updateProfileName(name);
  updateProfileStatus  = (s: string)    => this.sock.updateProfileStatus(s);

  // Groups
  groups = {
    create:        (subject: string, participants: string[]) => groups.createGroup(this.sock, subject, participants),
    info:          (jid: string) => groups.groupInfo(this.sock, jid),
    add:           (jid: string, p: string[]) => groups.addMembers(this.sock, jid, p),
    remove:        (jid: string, p: string[]) => groups.removeMembers(this.sock, jid, p),
    promote:       (jid: string, p: string[]) => groups.promoteMembers(this.sock, jid, p),
    demote:        (jid: string, p: string[]) => groups.demoteMembers(this.sock, jid, p),
    setSubject:    (jid: string, s: string)   => groups.setGroupSubject(this.sock, jid, s),
    setDescription:(jid: string, d: string)   => groups.setGroupDescription(this.sock, jid, d),
    setMessaging:  (jid: string, m: "announcement"|"not_announcement") => groups.setMessagingPolicy(this.sock, jid, m),
    setEdit:       (jid: string, m: "locked"|"unlocked")               => groups.setEditPolicy(this.sock, jid, m),
    invite:        (jid: string) => groups.getInviteCode(this.sock, jid),
    revokeInvite:  (jid: string) => groups.revokeInviteCode(this.sock, jid),
    accept:        (code: string) => groups.acceptInvite(this.sock, code),
    leave:         (jid: string) => groups.leaveGroup(this.sock, jid),
    list:          ()             => groups.listGroups(this.sock),
  };
}
