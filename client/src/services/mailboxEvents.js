export const MAILBOX_REFRESH_EVENT = "mailbox:refresh";

export function notifyMailboxChanged() {
  window.dispatchEvent(new CustomEvent(MAILBOX_REFRESH_EVENT));
}
