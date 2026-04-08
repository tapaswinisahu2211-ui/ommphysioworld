import { useEffect, useMemo, useState } from "react";
import { Check, Search, Star, Trash2 } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";

const renderStars = (count) =>
  Array.from({ length: 5 }, (_, index) => (
    <Star
      key={`${count}-${index}`}
      size={15}
      className={index < count ? "fill-amber-400 text-amber-400" : "text-slate-300"}
    />
  ));

export default function FeedbackManagement() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadFeedback = async () => {
    try {
      const response = await API.get("/feedback");
      setFeedbackList(response.data);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const filteredFeedback = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return feedbackList;
    }

    return feedbackList.filter((item) =>
      [item.name, item.email, item.comment].join(" ").toLowerCase().includes(keyword)
    );
  }, [feedbackList, search]);

  const pendingFeedback = filteredFeedback.filter((item) => !item.isApproved);
  const approvedFeedback = filteredFeedback.filter((item) => item.isApproved);

  const updateApproval = async (item, isApproved) => {
    try {
      const response = await API.patch(`/feedback/${item.id}/approve`, { isApproved });
      setFeedbackList((current) =>
        current.map((entry) => (entry.id === item.id ? response.data : entry))
      );
      setError("");
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update feedback.");
    }
  };

  const deleteFeedback = async (id) => {
    try {
      await API.delete(`/feedback/${id}`);
      setFeedbackList((current) => current.filter((item) => item.id !== id));
      setError("");
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete feedback.");
    }
  };

  const renderSection = (title, subtitle, rows, emptyText) => (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {rows.length} items
        </div>
      </div>

      <div className="space-y-4">
        {!loading && rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {emptyText}
          </div>
        ) : (
          rows.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.isApproved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{item.email || "No email added"}</p>
                  <div className="flex items-center gap-1">{renderStars(item.stars)}</div>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600">{item.comment}</p>
                  <p className="text-xs text-slate-400">
                    Submitted {new Date(item.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateApproval(item, !item.isApproved)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
                      item.isApproved
                        ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    <Check size={15} />
                    {item.isApproved ? "Unapprove" : "Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteFeedback(item.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-emerald-950 to-cyan-900 px-5 py-4 text-white shadow-md">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Website Reviews</p>
            <div>
              <h1 className="text-2xl font-semibold">Feedback Approval</h1>
              <p className="mt-1 max-w-2xl text-sm text-white/75">
                Review public feedback, approve the best comments, and publish them on the website.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Feedback</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : feedbackList.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending Approval</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : feedbackList.filter((item) => !item.isApproved).length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Published</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : feedbackList.filter((item) => item.isApproved).length}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, email, or comment"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        {renderSection(
          "Pending Feedback",
          "Approve these comments to publish them on the public website.",
          pendingFeedback,
          "No pending feedback right now."
        )}

        {renderSection(
          "Approved Feedback",
          "These comments are already visible on the website.",
          approvedFeedback,
          "No approved feedback found."
        )}
      </div>
    </DashboardLayout>
  );
}
