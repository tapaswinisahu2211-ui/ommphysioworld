import { MessageCircle, Paperclip, Send, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import { canViewModule, getStoredUser, isAdminUser } from "../utils/auth";

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function DashboardChatWidget() {
  const currentUser = useMemo(() => getStoredUser(), []);
  const adminUser = isAdminUser(currentUser);
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);
  const previousUnreadIdsRef = useRef([]);
  const audioContextRef = useRef(null);

  const canUseChat = Boolean(
    currentUser.id && (currentUser.role === "Admin" || canViewModule("chat", currentUser))
  );

  useEffect(() => {
    if (!canUseChat) {
      return undefined;
    }

    let isMounted = true;

    const ensureAudioContext = async () => {
      if (typeof window === "undefined") {
        return null;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      if (audioContextRef.current.state === "suspended") {
        try {
          await audioContextRef.current.resume();
        } catch (resumeError) {
          console.log("Chat audio resume skipped:", resumeError.message);
        }
      }

      return audioContextRef.current;
    };

    const playNotificationSound = async () => {
      const context = await ensureAudioContext();
      if (!context) {
        return;
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.linearRampToValueAtTime(660, context.currentTime + 0.18);
      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.28);
    };

    const loadConversations = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/chat/conversations?agentId=${currentUser.id}`);
        if (isMounted) {
          const nextConversations = response.data;
          const unreadConversations = nextConversations.filter((conversation) => conversation.unreadForAgent);
          const unreadIds = unreadConversations.map((conversation) => conversation.id);
          const previousUnreadIds = previousUnreadIdsRef.current;
          const newUnreadConversation = unreadConversations.find(
            (conversation) => !previousUnreadIds.includes(conversation.id)
          );

          setConversations(nextConversations);
          setSelectedId((current) => {
            if (newUnreadConversation) {
              return newUnreadConversation.id;
            }

            if (current && nextConversations.some((conversation) => conversation.id === current)) {
              return current;
            }

            return nextConversations[0]?.id || "";
          });

          if (hasLoadedRef.current && newUnreadConversation) {
            setOpen(true);
            playNotificationSound();
          }

          previousUnreadIdsRef.current = unreadIds;
          hasLoadedRef.current = true;
          setError("");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.response?.data?.message || "Failed to load chats.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const unlockAudio = () => {
      ensureAudioContext();
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    loadConversations();
    const intervalId = window.setInterval(loadConversations, 5000);

    return () => {
      isMounted = false;
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.clearInterval(intervalId);
    };
  }, [canUseChat, currentUser.id]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) || null;
  const unreadCount = conversations.filter((conversation) => conversation.unreadForAgent).length;

  useEffect(() => {
    if (!open || !selectedConversation?.unreadForAgent) {
      return;
    }

    const markRead = async () => {
      try {
        const response = await API.patch(`/chat/conversations/${selectedConversation.id}/read`, {
          agentId: currentUser.id,
        });
        setConversations((current) =>
          current.map((item) => (item.id === selectedConversation.id ? response.data : item))
        );
      } catch (markError) {
        console.error("Failed to mark chat read:", markError);
      }
    };

    markRead();
  }, [currentUser.id, open, selectedConversation?.id, selectedConversation?.unreadForAgent]);

  const sendReply = async (e) => {
    e.preventDefault();

    if (!selectedConversation || (!reply.trim() && !attachments.length)) {
      return;
    }

    setSending(true);

    try {
      const payload = new FormData();
      payload.append("senderUserId", currentUser.id);
      payload.append("text", reply.trim());
      attachments.forEach((file) => payload.append("attachments", file));
      const response = await API.post(
        `/chat/conversations/${selectedConversation.id}/messages`,
        payload
      );

      setConversations((current) =>
        current.map((item) => (item.id === selectedConversation.id ? response.data : item))
      );
      setReply("");
      setAttachments([]);
      setError("");
    } catch (sendError) {
      setError(sendError.response?.data?.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async () => {
    if (!selectedConversation || !adminUser) {
      return;
    }

    try {
      await API.delete(`/chat/conversations/${selectedConversation.id}`, {
        data: {
          requesterUserId: currentUser.id,
        },
      });

      setConversations((current) =>
        current.filter((conversation) => conversation.id !== selectedConversation.id)
      );
      setSelectedId("");
      setReply("");
      setError("");
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete conversation.");
    }
  };

  if (!canUseChat) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open ? (
        <div className="mb-3 flex h-[520px] w-[720px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="w-[280px] border-r border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Website Chats</p>
                <p className="text-xs text-slate-500">{unreadCount} unread</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="h-[calc(520px-73px)] overflow-y-auto p-3">
              {loading && !conversations.length ? (
                <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500">
                  Loading chats...
                </div>
              ) : conversations.length ? (
                conversations.map((conversation) => {
                  const lastMessage = conversation.messages[conversation.messages.length - 1];
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(conversation.id);
                        setAttachments([]);
                      }}
                      className={`mb-2 w-full rounded-2xl border px-4 py-3 text-left last:mb-0 ${
                        selectedId === conversation.id
                          ? "border-slate-900 bg-white shadow-sm"
                          : "border-transparent bg-white/80 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-slate-900">
                          {conversation.visitorName}
                        </p>
                        {conversation.unreadForAgent ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {conversation.visitorContact || "No contact shared"}
                      </p>
                      <p className="mt-2 truncate text-sm text-slate-600">
                        {lastMessage?.text ||
                          (lastMessage?.attachments?.length
                            ? `${lastMessage.attachments.length} attachment${
                                lastMessage.attachments.length === 1 ? "" : "s"
                              }`
                            : "No messages")}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500">
                  No website chats yet.
                </div>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            {selectedConversation ? (
              <>
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{selectedConversation.visitorName}</p>
                      <p className="text-sm text-slate-500">
                        {selectedConversation.visitorContact || "No contact shared"}
                      </p>
                    </div>
                    {adminUser ? (
                      <button
                        type="button"
                        onClick={deleteConversation}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-5 py-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderType === "agent" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.senderType === "agent"
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {message.text ? <p>{message.text}</p> : null}
                        {message.attachments?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={`${API.defaults.baseURL}${attachment.downloadUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${
                                  message.senderType === "agent"
                                    ? "bg-white/10 text-white"
                                    : "bg-sky-50 text-sky-700"
                                }`}
                              >
                                <Paperclip size={12} />
                                {attachment.name || "Attachment"}
                              </a>
                            ))}
                          </div>
                        ) : null}
                        <p
                          className={`mt-1 text-[11px] ${
                            message.senderType === "agent" ? "text-white/60" : "text-slate-400"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendReply} className="border-t border-slate-200 bg-white p-4">
                  {error ? (
                    <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  ) : null}
                  <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                      <Paperclip size={16} />
                      Add image or document
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={(event) =>
                          setAttachments(Array.from(event.target.files || []))
                        }
                      />
                    </label>
                    {attachments.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attachments.map((file) => (
                          <span
                            key={`${file.name}-${file.size}-${file.lastModified}`}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700"
                          >
                            <Paperclip size={11} />
                            {file.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-3">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your reply"
                      className="min-h-[84px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="inline-flex h-fit items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Send size={16} />
                      {sending ? "Sending..." : "Reply"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-500">
                Select a chat from the left to start replying.
              </div>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl transition hover:scale-105 hover:bg-slate-800"
        title="Website chat"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
