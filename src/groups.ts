import { WASocket, GroupMetadata, ParticipantAction } from "@whiskeysockets/baileys";
import { toJid } from "./utils";

/** Create a new group */
export function createGroup(sock: WASocket, subject: string, participants: string[]) {
  return sock.groupCreate(subject, participants.map(toJid));
}

/** Get group metadata */
export function groupInfo(sock: WASocket, jid: string): Promise<GroupMetadata> {
  return sock.groupMetadata(jid);
}

/** Add / remove / promote / demote participants */
export function updateParticipants(sock: WASocket, jid: string, participants: string[], action: ParticipantAction) {
  return sock.groupParticipantsUpdate(jid, participants.map(toJid), action);
}
export const addMembers     = (s: WASocket, j: string, p: string[]) => updateParticipants(s, j, p, "add");
export const removeMembers  = (s: WASocket, j: string, p: string[]) => updateParticipants(s, j, p, "remove");
export const promoteMembers = (s: WASocket, j: string, p: string[]) => updateParticipants(s, j, p, "promote");
export const demoteMembers  = (s: WASocket, j: string, p: string[]) => updateParticipants(s, j, p, "demote");

/** Update group subject / description / settings */
export const setGroupSubject     = (s: WASocket, j: string, subject: string)  => s.groupUpdateSubject(j, subject);
export const setGroupDescription = (s: WASocket, j: string, desc: string)     => s.groupUpdateDescription(j, desc);

/** "announcement" = only admins can send | "not_announcement" = everyone */
export const setMessagingPolicy  = (s: WASocket, j: string, mode: "announcement" | "not_announcement") =>
  s.groupSettingUpdate(j, mode);
/** "locked" = only admins edit info | "unlocked" = everyone */
export const setEditPolicy       = (s: WASocket, j: string, mode: "locked" | "unlocked") =>
  s.groupSettingUpdate(j, mode);

/** Group invite link helpers */
export const getInviteCode    = (s: WASocket, j: string) => s.groupInviteCode(j);
export const revokeInviteCode = (s: WASocket, j: string) => s.groupRevokeInvite(j);
export const acceptInvite     = (s: WASocket, code: string) => s.groupAcceptInvite(code);
export const leaveGroup       = (s: WASocket, j: string) => s.groupLeave(j);

/** Fetch all groups the bot is in */
export async function listGroups(sock: WASocket): Promise<Record<string, GroupMetadata>> {
  return sock.groupFetchAllParticipating();
}
