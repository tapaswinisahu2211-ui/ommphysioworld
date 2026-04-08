import { MessageCircle, Paperclip, Send, Stethoscope, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const STORAGE_KEY = "publicChatConversation";

export default function PublicChatWidget() {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorContact, setVisitorContact] = useState("");
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(() => localStorage.getItem(STORAGE_KEY) || "");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let isMounted = true;

    const loadAgents = async () => {
      try {
        setLoading(true);
        const response = await API.get("/public-chat-agents");
        if (isMounted) {
          setAgents(response.data);
          setSelectedAgentId((current) => current || response.data[0]?.id || "");
        }
      } catch (loadError) {
        if (isMounted) {
          setAgents([]);
          setError("Failed to load online staff.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const loadConversation = async () => {
      if (!conversationId) {
        return;
      }

      try {
        const response = await API.get(`/public-chat/conversations/${conversationId}`);
        if (isMounted) {
          setConversation(response.data);
          setVisitorName((current) => current || response.data.visitorName || "");
          setVisitorContact((current) => current || response.data.visitorContact || "");
        }
      } catch (loadError) {
        localStorage.removeItem(STORAGE_KEY);
        setConversationId("");
        if (isMounted) {
          setConversation(null);
        }
      }
    };

    loadAgents();
    loadConversation();
    const intervalId = window.setInterval(() => {
      loadAgents();
      loadConversation();
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [conversationId, open]);

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) || null;

  const handleStartOrSend = async (e) => {
    e.preventDefault();

    if (!visitorName.trim() || (!messageText.trim() && !attachments.length)) {
      setError("Please enter your name and a message or attachment.");
      return;
    }

    setSending(true);
    setError("");

    try {
      if (conversation) {
        const payload = new FormData();
        payload.append("visitorName", visitorName.trim());
        payload.append("text", messageText.trim());
        attachments.forEach((file) => payload.append("attachments", file));
        const response = await API.post(
          `/public-chat/conversations/${conversation.id}/messages`,
          payload
        );
        setConversation(response.data);
      } else {
        if (!selectedAgentId) {
          setError("No doctor or staff is available right now.");
          setSending(false);
          return;
        }

        const payload = new FormData();
        payload.append("agentId", selectedAgentId);
        payload.append("visitorName", visitorName.trim());
        payload.append("visitorContact", visitorContact.trim());
        payload.append("text", messageText.trim());
        attachments.forEach((file) => payload.append("attachments", file));
        const response = await API.post("/public-chat/conversations", payload);
        setConversation(response.data);
        localStorage.setItem(STORAGE_KEY, response.data.id);
        setConversationId(response.data.id);
      }

      setMessageText("");
      setAttachments([]);
    } catch (sendError) {
      setError(sendError.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const closeConversation = () => {
    setConversation(null);
    setMessageText("");
    setAttachments([]);
    localStorage.removeItem(STORAGE_KEY);
    setConversationId("");
  };

  return (
    <div className="fixed bottom-20 right-4 z-[65] sm:bottom-24 sm:right-6">
      {open ? (
        <div className="mb-3 w-[360px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-slate-950 via-cyan-900 to-emerald-800 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-white/70">Live Chat</p>
                <h3 className="mt-1 text-xl font-semibold">
                  {conversation ? "Continue your chat" : "Talk to our clinic team"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/15"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-4">
            {loading && !conversation ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Checking who is online...
              </div>
            ) : conversation ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {conversation.assignedTo?.name || "Clinic Team"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {conversation.assignedTo?.workType || "Available staff"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeConversation}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                      New Chat
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderType === "visitor" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.senderType === "visitor"
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-700"
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
                                  message.senderType === "visitor"
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
                            message.senderType === "visitor" ? "text-white/60" : "text-slate-400"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleStartOrSend} className="space-y-3">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message"
                    className="min-h-[96px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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
                  {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Send size={16} />
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            ) : agents.length ? (
              <form onSubmit={handleStartOrSend} className="space-y-4">
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${
                        selectedAgentId === agent.id
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                        {agent.profileImageUrl ? (
                          <img
                            src={`${API.defaults.baseURL}${agent.profileImageUrl}`}
                            alt={agent.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-semibold text-slate-700">{agent.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-slate-900">{agent.name}</p>
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-sm text-slate-500">{agent.workType}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  required
                />
                <input
                  type="text"
                  value={visitorContact}
                  onChange={(e) => setVisitorContact(e.target.value)}
                  placeholder="Phone or email (optional)"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${selectedAgent?.name || "doctor/staff"}`}
                  className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Send size={16} />
                  {sending ? "Starting..." : "Start Chat"}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                  <Stethoscope size={22} />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-900">
                  Doctor or staff is not available right now.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Kindly book an appointment and our clinic team will get back to you.
                </p>
                <Link
                  to="/patient-login?redirect=/patient-dashboard"
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Book Appointment
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl transition hover:scale-105 hover:bg-emerald-700"
        title="Open chat"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
