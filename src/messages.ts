import { proto, WASocket, AnyMessageContent } from "@whiskeysockets/baileys";
import { CallButton, ListSection, PollOptions, QuickReplyButton, UrlButton } from "./types";
import { toJid } from "./utils";

/** Send plain text */
export function sendText(sock: WASocket, jid: string, text: string, quoted?: proto.IWebMessageInfo) {
  return sock.sendMessage(toJid(jid), { text }, { quoted });
}

/** Send image / video / audio / document via URL or Buffer */
export async function sendMedia(
  sock: WASocket,
  jid: string,
  type: "image" | "video" | "audio" | "document" | "sticker",
  source: string | Buffer,
  opts: { caption?: string; mimetype?: string; fileName?: string; ptt?: boolean; gifPlayback?: boolean } = {},
  quoted?: proto.IWebMessageInfo
) {
  const media = typeof source === "string" ? { url: source } : source;
  let content: AnyMessageContent;
  switch (type) {
    case "image":    content = { image: media as any, caption: opts.caption }; break;
    case "video":    content = { video: media as any, caption: opts.caption, gifPlayback: opts.gifPlayback }; break;
    case "audio":    content = { audio: media as any, mimetype: opts.mimetype ?? "audio/mp4", ptt: opts.ptt }; break;
    case "document": content = { document: media as any, mimetype: opts.mimetype ?? "application/octet-stream", fileName: opts.fileName ?? "file", caption: opts.caption }; break;
    case "sticker":  content = { sticker: media as any }; break;
  }
  return sock.sendMessage(toJid(jid), content, { quoted });
}

/**
 * Send modern WhatsApp Interactive Buttons (native flow quick-replies).
 * Works on the latest WhatsApp clients (replaces deprecated buttonsMessage).
 */
export function sendButtons(
  sock: WASocket,
  jid: string,
  body: string,
  buttons: QuickReplyButton[],
  opts: { footer?: string; title?: string; quoted?: proto.IWebMessageInfo } = {}
) {
  const nativeButtons = buttons.map(b => ({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({ display_text: b.title, id: b.id }),
  }));

  const interactive = proto.Message.InteractiveMessage.create({
    body:   proto.Message.InteractiveMessage.Body.create({ text: body }),
    footer: proto.Message.InteractiveMessage.Footer.create({ text: opts.footer ?? "popkidmd-baileys" }),
    header: proto.Message.InteractiveMessage.Header.create({ title: opts.title ?? "", hasMediaAttachment: false }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: nativeButtons as any }),
  });

  const msg: proto.IMessage = {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} },
        interactiveMessage: interactive,
      },
    },
  };

  return sock.relayMessage(toJid(jid), msg, {});
}

/** Send URL buttons (cta_url) */
export function sendUrlButtons(
  sock: WASocket, jid: string, body: string, buttons: UrlButton[], opts: { footer?: string; quoted?: proto.IWebMessageInfo } = {}
) {
  const nativeButtons = buttons.map(b => ({
    name: "cta_url",
    buttonParamsJson: JSON.stringify({ display_text: b.title, url: b.url, merchant_url: b.url }),
  }));
  const interactive = proto.Message.InteractiveMessage.create({
    body:   proto.Message.InteractiveMessage.Body.create({ text: body }),
    footer: proto.Message.InteractiveMessage.Footer.create({ text: opts.footer ?? "popkidmd-baileys" }),
    header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: nativeButtons as any }),
  });
  return sock.relayMessage(toJid(jid), { viewOnceMessage: { message: { interactiveMessage: interactive } } }, {});
}

/** Send call buttons (cta_call) */
export function sendCallButtons(
  sock: WASocket, jid: string, body: string, buttons: CallButton[], opts: { footer?: string } = {}
) {
  const nativeButtons = buttons.map(b => ({
    name: "cta_call",
    buttonParamsJson: JSON.stringify({ display_text: b.title, phone_number: b.phone }),
  }));
  const interactive = proto.Message.InteractiveMessage.create({
    body:   proto.Message.InteractiveMessage.Body.create({ text: body }),
    footer: proto.Message.InteractiveMessage.Footer.create({ text: opts.footer ?? "popkidmd-baileys" }),
    header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: nativeButtons as any }),
  });
  return sock.relayMessage(toJid(jid), { viewOnceMessage: { message: { interactiveMessage: interactive } } }, {});
}

/** Send a list message */
export function sendList(
  sock: WASocket,
  jid: string,
  body: string,
  buttonText: string,
  sections: ListSection[],
  opts: { title?: string; footer?: string; quoted?: proto.IWebMessageInfo } = {}
) {
  return sock.sendMessage(
    toJid(jid),
    {
      text: body,
      footer: opts.footer ?? "popkidmd-baileys",
      title: opts.title ?? "Menu",
      buttonText,
      sections,
    } as any,
    { quoted: opts.quoted }
  );
}

/** Send a poll (single or multi-choice) */
export function sendPoll(sock: WASocket, jid: string, poll: PollOptions, quoted?: proto.IWebMessageInfo) {
  return sock.sendMessage(
    toJid(jid),
    { poll: { name: poll.name, values: poll.values, selectableCount: poll.selectableCount ?? 1 } } as any,
    { quoted }
  );
}

/** React to a message */
export function react(sock: WASocket, jid: string, key: proto.IMessageKey, emoji: string) {
  return sock.sendMessage(toJid(jid), { react: { text: emoji, key } });
}

/** Forward an existing message */
export function forward(sock: WASocket, jid: string, msg: proto.IWebMessageInfo) {
  return sock.sendMessage(toJid(jid), { forward: msg } as any);
}

/** Edit a previously-sent message */
export function editMessage(sock: WASocket, jid: string, key: proto.IMessageKey, newText: string) {
  return sock.sendMessage(toJid(jid), { text: newText, edit: key } as any);
}

/** Delete a message for everyone */
export function deleteMessage(sock: WASocket, jid: string, key: proto.IMessageKey) {
  return sock.sendMessage(toJid(jid), { delete: key });
}

/** Send a contact card */
export function sendContact(sock: WASocket, jid: string, contact: { fullName: string; phone: string; org?: string }) {
  const vcard =
    "BEGIN:VCARD\nVERSION:3.0\n" +
    `FN:${contact.fullName}\n` +
    (contact.org ? `ORG:${contact.org};\n` : "") +
    `TEL;type=CELL;type=VOICE;waid=${contact.phone.replace(/\D/g,"")}:+${contact.phone}\nEND:VCARD`;
  return sock.sendMessage(toJid(jid), { contacts: { displayName: contact.fullName, contacts: [{ vcard }] } });
}

/** Send a location */
export function sendLocation(sock: WASocket, jid: string, lat: number, lng: number, name?: string, address?: string) {
  return sock.sendMessage(toJid(jid), { location: { degreesLatitude: lat, degreesLongitude: lng, name, address } });
}
