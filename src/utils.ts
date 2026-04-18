import type { WAMessage } from "@whiskeysockets/baileys";

/** Normalize any input (number, jid) to a valid WhatsApp JID */
export function toJid(input: string): string {
  if (input.endsWith("@s.whatsapp.net") || input.endsWith("@g.us") || input.endsWith("@broadcast")) return input;
  const digits = input.replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
}

export function isGroupJid(jid?: string | null): boolean {
  return !!jid && jid.endsWith("@g.us");
}

export function isStatusJid(jid?: string | null): boolean {
  return jid === "status@broadcast";
}

/** Extract plain text content from any message type */
export function extractText(m: WAMessage): string {
  const msg = m.message;
  if (!msg) return "";
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.templateButtonReplyMessage?.selectedId ||
    (msg as any).interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    ""
  );
}

/** Sleep helper */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
