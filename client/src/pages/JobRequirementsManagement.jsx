import {
  BriefcaseBusiness,
  CheckCircle2,
  Edit3,
  EyeOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";

const emptyForm = {
  title: "",
  department: "",
  employmentType: "",
  experience: "",
  location: "",
  openings: 1,
  summary: "",
  responsibilities: "",
  requirements: "",
  benefits: "",
  status: "Active",
  isPublished: true,
};

const toFormState = (item) => ({
  title: item?.title || "",
  department: item?.department || "",
  employmentType: item?.employmentType || "",
  experience: item?.experience || "",
  location: item?.location || "",
  openings: item?.openings || 1,
  summary: item?.summary || "",
  responsibilities: (item?.responsibilities || []).join("\n"),
  requirements: (item?.requirements || []).join("\n"),
  benefits: (item?.benefits || []).join("\n"),
  status: item?.status || "Active",
  isPublished: item?.isPublished !== false,
});

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700",
  Completed: "bg-slate-100 text-slate-700",
  Unpublished: "bg-amber-50 text-amber-700",
};

export default function JobRequirementsManagement() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);

  const loadRequirements = async () => {
    try {
      const response = await API.get("/job-requirements");
      setRequirements(response.data);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load job requirements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const filteredRequirements = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return requirements;
    }

    return requirements.filter((item) =>
      [item.title, item.department, item.location, item.employmentType, item.experience]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [requirements, search]);

  const resetForm = () => {
    setEditingId("");
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        openings: Number(form.openings || 1),
        isPublished: form.status === "Unpublished" ? false : form.isPublished,
      };

      const response = editingId
        ? await API.put(`/job-requirements/${editingId}`, payload)
        : await API.post("/job-requirements", payload);

      setRequirements((current) => {
        if (editingId) {
          return current.map((item) => (item.id === editingId ? response.data : item));
        }

        return [response.data, ...current];
      });
      resetForm();
      setError("");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save job requirement.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm(toFormState(item));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRequirement = async (id) => {
    try {
      await API.delete(`/job-requirements/${id}`);
      setRequirements((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setError("");
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete job requirement.");
    }
  };

  const publishedCount = requirements.filter((item) => item.isPublished).length;
  const unpublishedCount = requirements.filter((item) => item.status === "Unpublished").length;
  const completedCount = requirements.filter((item) => item.status === "Completed").length;
  const activeCount = requirements.filter((item) => item.status === "Active").length;

  const updateRequirementStatus = async (item, status) => {
    try {
      const payload = {
        ...toFormState(item),
        openings: Number(item.openings || 1),
        status,
        isPublished: status === "Active",
      };

      const response = await API.put(`/job-requirements/${item.id}`, payload);
      setRequirements((current) =>
        current.map((entry) => (entry.id === item.id ? response.data : entry))
      );
      if (editingId === item.id) {
        setForm(toFormState(response.data));
      }
      setError("");
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update job status.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-emerald-900 px-5 py-4 text-white shadow-md">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-white/60">Career</p>
            <div>
              <h1 className="text-2xl font-semibold">Job Requirement Management</h1>
              <p className="mt-1 max-w-2xl text-sm text-white/75">
                Post employee requirements from admin and publish them to the user-side career page.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Requirements</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : requirements.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : activeCount}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Published</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : publishedCount}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Unpublished</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : unpublishedCount}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {loading ? "..." : completedCount}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingId ? "Edit Requirement" : "Post New Requirement"}
                </h2>
                <p className="text-sm text-slate-500">
                  Keep the role details clear, then control whether it is active, completed, or hidden.
                </p>
              </div>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusStyles[form.status]
                  }`}
                >
                  {form.status}
                </span>
                <span className="text-sm text-slate-500">
                  {form.status === "Active"
                    ? form.isPublished
                      ? "Visible on the website"
                      : "Saved but not visible on the website"
                    : form.status === "Completed"
                      ? "Job post is closed and removed from public listing"
                      : "Hidden from the website until published again"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <input
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="Job title"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                required
              />
              <input
                value={form.department}
                onChange={(e) => setForm((current) => ({ ...current, department: e.target.value }))}
                placeholder="Department"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              <input
                value={form.employmentType}
                onChange={(e) =>
                  setForm((current) => ({ ...current, employmentType: e.target.value }))
                }
                placeholder="Employment type"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              <input
                value={form.experience}
                onChange={(e) => setForm((current) => ({ ...current, experience: e.target.value }))}
                placeholder="Experience"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              <input
                value={form.location}
                onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                placeholder="Location"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              <input
                type="number"
                min="1"
                value={form.openings}
                onChange={(e) => setForm((current) => ({ ...current, openings: e.target.value }))}
                placeholder="Openings"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              <textarea
                value={form.summary}
                onChange={(e) => setForm((current) => ({ ...current, summary: e.target.value }))}
                placeholder="Short job summary"
                className="min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 md:col-span-2"
              />
              <textarea
                value={form.responsibilities}
                onChange={(e) =>
                  setForm((current) => ({ ...current, responsibilities: e.target.value }))
                }
                placeholder="Responsibilities, one per line"
                className="min-h-[160px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              <textarea
                value={form.requirements}
                onChange={(e) =>
                  setForm((current) => ({ ...current, requirements: e.target.value }))
                }
                placeholder="Requirements, one per line"
                className="min-h-[160px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              <textarea
                value={form.benefits}
                onChange={(e) => setForm((current) => ({ ...current, benefits: e.target.value }))}
                placeholder="Benefits, one per line"
                className="min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 md:col-span-2"
              />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Job Status
                </p>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      status: e.target.value,
                      isPublished: e.target.value === "Unpublished" ? false : current.isPublished,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Unpublished">Unpublished</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, isPublished: e.target.checked }))
                  }
                  disabled={form.status !== "Active"}
                  className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                />
                Show on website
              </label>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 md:col-span-2"
              >
                <Plus size={16} />
                {saving ? "Saving..." : editingId ? "Update Requirement" : "Post Requirement"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Posted Requirements</h2>
              <p className="text-sm text-slate-500">
                Manage live roles, close completed posts, or hide openings from the website.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search requirement title, department, or location"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            {!loading && !filteredRequirements.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No job requirements found.
              </div>
            ) : (
              filteredRequirements.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <BriefcaseBusiness size={18} />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                          <p className="text-sm text-slate-500">
                            {[item.department, item.location, item.employmentType].filter(Boolean).join(" | ") || "No extra details added"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[item.status]}`}
                        >
                          {item.status}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.isPublished
                              ? "bg-sky-50 text-sky-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.isPublished ? "Visible" : "Hidden"}
                        </span>
                      </div>
                      <p className="text-sm leading-7 text-slate-600">
                        {item.summary || "No summary added yet."}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {item.department ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {item.department}
                          </span>
                        ) : null}
                        {item.location ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {item.location}
                          </span>
                        ) : null}
                        {item.employmentType ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {item.employmentType}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {item.openings} opening{item.openings > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Updated {new Date(item.updatedAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.status !== "Active" ? (
                        <button
                          type="button"
                          onClick={() => updateRequirementStatus(item, "Active")}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                        >
                          <CheckCircle2 size={15} />
                          Mark Active
                        </button>
                      ) : null}
                      {item.status !== "Completed" ? (
                        <button
                          type="button"
                          onClick={() => updateRequirementStatus(item, "Completed")}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                        >
                          <CheckCircle2 size={15} />
                          Mark Completed
                        </button>
                      ) : null}
                      {item.status !== "Unpublished" ? (
                        <button
                          type="button"
                          onClick={() => updateRequirementStatus(item, "Unpublished")}
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                        >
                          <EyeOff size={15} />
                          Unpublish
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRequirement(item.id)}
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
        </div>
      </div>
    </DashboardLayout>
  );
}
