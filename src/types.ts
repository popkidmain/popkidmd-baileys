import type { proto, WAMessage } from "@whiskeysockets/baileys";

export type LogLevel = "silent" | "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface PopkidOptions {
  /** Folder where multi-file auth state is stored. Default: "./popkid_session" */
  sessionPath?: string;
  /** Print QR in terminal automatically. Default: true */
  printQRInTerminal?: boolean;
  /** Pino log level. Default: "silent" */
  logLevel?: LogLevel;
  /** Browser tuple shown in WhatsApp Linked Devices. Default: ["popkidmd-baileys","Chrome","1.0.0"] */
  browser?: [string, string, string];
  /** Use pairing code instead of QR (8-digit code). Phone in international format e.g. "254712345678" */
  pairingNumber?: string;
  /** Mark messages as read automatically. Default: false */
  autoRead?: boolean;
  /** Always-online presence. Default: false */
  alwaysOnline?: boolean;
  /** Auto-reconnect on disconnect (except logged out). Default: true */
  autoReconnect?: boolean;
}

export interface QuickReplyButton { id: string; title: string; }
export interface UrlButton { title: string; url: string; }
export interface CallButton { title: string; phone: string; }

export interface ListRow { title: string; rowId: string; description?: string; }
export interface ListSection { title: string; rows: ListRow[]; }

export interface PollOptions {
  name: string;
  values: string[];
  selectableCount?: number; // 0 = unlimited (multi-choice), 1 = single choice
}

export type MessageHandler = (m: WAMessage, ctx: { from: string; text: string; isGroup: boolean }) => any | Promise<any>;
export type ProtoMsg = proto.IMessage;
