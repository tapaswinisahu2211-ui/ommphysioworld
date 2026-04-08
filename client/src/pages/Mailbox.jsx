import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Download,
  Mail,
  MailCheck,
  MessageSquareText,
  Paperclip,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";
import { MAILBOX_REFRESH_EVENT, notifyMailboxChanged } from "../services/mailboxEvents";

const formatDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Mailbox() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const loadMailbox = useCallback(async () => {
    try {
      const response = await API.get("/mailbox");
      setItems(response.data);
      setSelectedId((current) => {
        const requestedId = location.state?.selectedId;

        if (requestedId && response.data.some((item) => item.id === requestedId)) {
          return requestedId;
        }

        return current || response.data[0]?.id || "";
      });
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load mailbox.");
    } finally {
      setLoading(false);
    }
  }, [location.state?.selectedId]);

  useEffect(() => {
    loadMailbox();
  }, [loadMailbox]);

  useEffect(() => {
    const handleRefresh = () => loadMailbox();
    const intervalId = window.setInterval(loadMailbox, 5000);

    window.addEventListener(MAILBOX_REFRESH_EVENT, handleRefresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(MAILBOX_REFRESH_EVENT, handleRefresh);
    };
  }, [loadMailbox]);

  const filteredItems = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return items.filter((item) => {
      const typeMatch = activeTab === "all" ? true : item.type === activeTab;

      if (!typeMatch) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [
        item.senderName,
        item.senderEmail,
        item.senderPhone,
        item.subject,
        item.service,
        item.role,
        item.message,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [activeTab, items, search]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedId("");
      return;
    }

    const exists = filteredItems.some((item) => item.id === selectedId);

    if (!exists) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selectedItem = filteredItems.find((item) => item.id === selectedId) || null;

  const unreadCount = items.filter((item) => !item.isRead).length;
  const careerCount = items.filter((item) => item.type === "career").length;
  const contactCount = items.filter((item) => item.type === "contact").length;

  const markItemRead = async (item, isRead = true) => {
    if (!item || item.isRead === isRead) {
      return;
    }

    try {
      const response = await API.patch(`/mailbox/${item.type}/${item.id}/read`, {
        isRead,
      });

      setItems((current) =>
        current.map((entry) => (entry.id === item.id ? response.data : entry))
      );
      notifyMailboxChanged();
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update mailbox item.");
    }
  };

  const handleSelect = async (item) => {
    setSelectedId(item.id);
    await markItemRead(item, true);
  };

  const statCards = [
    {
      label: "Inbox Items",
      value: items.length,
      icon: Mail,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Unread",
      value: unreadCount,
      icon: MailCheck,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Career Mails",
      value: careerCount,
      icon: BriefcaseBusiness,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Mails",
      value: contactCount,
      icon: MessageSquareText,
      tone: "bg-cyan-50 text-cyan-700",
    },
  ];

  const tabs = [
    { id: "all", label: "All Mail" },
    { id: "career", label: "Career Apply" },
    { id: "contact", label: "Mails" },
  ];

  const getMailboxLabel = (type, long = false) => {
    if (type === "career") {
      return long ? "Career Application" : "Career";
    }

    return long ? "Mail Message" : "Mails";
  };

  const getMailboxTone = (type, selected = false) => {
    if (selected) {
      return "bg-white/10 text-white/75";
    }

    if (type === "career") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-cyan-100 text-cyan-700";
  };

  const getAttachmentUrl = (item) =>
    `${API.defaults.baseURL}/mailbox/${item.type}/${item.id}/attachment`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="motion-panel overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,#0f172a,#111827,#172554)] px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Internal Inbox
              </p>
              <div>
                <h1 className="text-2xl font-semibold">Mailbox</h1>
                <p className="mt-1 max-w-2xl text-sm text-white/75">
                  Read career applications and website contact messages directly
                  inside the admin panel. Appointment requests are now handled in
                  Treatment Tracker.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Latest Sync
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {loading ? "Loading..." : formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="stagger-grid grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="motion-card rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {loading ? "..." : value}
                  </p>
                </div>
                <div className={`rounded-xl p-2 ${tone}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
          <div className="motion-card rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative mt-4">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search inbox"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="mt-4 max-h-[700px] space-y-1.5 overflow-y-auto pr-1">
              {!loading && filteredItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center">
                  <Mail size={28} className="mx-auto text-slate-400" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    No mailbox items found
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    New career and contact messages will appear here.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`block w-full rounded-[18px] border px-3 py-2.5 text-left transition ${
                      selectedId === item.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                        : item.isRead
                        ? "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                        : "border-sky-200 bg-sky-50 hover:border-sky-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] ${getMailboxTone(
                              item.type,
                              selectedId === item.id
                            )}`}
                          >
                            {getMailboxLabel(item.type)}
                          </span>
                          {!item.isRead && selectedId !== item.id ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                          ) : null}
                        </div>
                        <p className="mt-1.5 truncate text-sm font-semibold">
                          {item.senderName}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 text-[11px] ${
                          selectedId === item.id ? "text-white/60" : "text-slate-400"
                        }`}
                      >
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="motion-card min-h-[640px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {selectedItem ? (
              <div className="flex h-full flex-col">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getMailboxTone(
                          selectedItem.type
                        )}`}
                      >
                        {getMailboxLabel(selectedItem.type, true)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {selectedItem.isRead ? "Read" : "Unread"}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                      {selectedItem.subject}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Received on {formatDate(selectedItem.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => markItemRead(selectedItem, !selectedItem.isRead)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Mark as {selectedItem.isRead ? "Unread" : "Read"}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Sender
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-3">
                        <UserRound size={16} />
                        <span>{selectedItem.senderName || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={16} />
                        <span>{selectedItem.senderEmail || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={16} />
                        <span>{selectedItem.senderPhone || "Not provided"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Request Details
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      {selectedItem.type === "career" ? (
                        <>
                          <p>
                            <span className="font-medium text-slate-900">Applied Role:</span>{" "}
                            {selectedItem.role || "Not provided"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">Experience:</span>{" "}
                            {selectedItem.experience || "Not provided"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            <span className="font-medium text-slate-900">Subject:</span>{" "}
                            {selectedItem.subject || "Mail Message"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-900">Source:</span>{" "}
                            Website contact form
                          </p>
                        </>
                      )}
                      {selectedItem.type === "career" ? (
                        <p>
                          <span className="font-medium text-slate-900">Attachment:</span>{" "}
                          {selectedItem.attachmentName || "None"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex-1 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Message Body
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {selectedItem.message || "No message was provided in this request."}
                  </p>

                  {selectedItem.attachmentName ? (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                        <Paperclip size={16} />
                        {selectedItem.attachmentName}
                      </div>

                      <a
                        href={getAttachmentUrl(selectedItem)}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${
                          selectedItem.hasAttachment
                            ? "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                            : "pointer-events-none border border-slate-200 bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Download size={16} />
                        {selectedItem.hasAttachment ? "Download Attachment" : "Attachment Unavailable"}
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <div>
                  <Mail size={34} className="mx-auto text-slate-400" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">
                    Select a mailbox item
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Pick any career application or contact message to read its full
                    details here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
