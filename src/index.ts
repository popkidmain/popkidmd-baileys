export { PopkidMD } from "./client";
export * from "./types";
export * from "./utils";
export * as messages from "./messages";
export * as groups from "./groups";

// Re-export all of Baileys so users get full power without extra install
export * from "@whiskeysockets/baileys";
export { default as makeWASocket } from "@whiskeysockets/baileys";
