import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import {
  Activity,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import API from "../services/api";
import { canAddModule, canEditModule, getStoredUser } from "../utils/auth";
import { cleanText } from "../utils/validation";

export default function Services() {
  const currentUser = getStoredUser();
  const canAddServices = canAddModule("services", currentUser);
  const canEditServices = canEditModule("services", currentUser);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ id: null, name: "" });
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadServices = async () => {
    try {
      const response = await API.get("/services");
      setServices(response.data);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const resetForm = () => {
    setForm({ id: null, name: "" });
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setError("");
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const name = cleanText(form.name);

    if (name.length < 2) {
      setError("Service name must be at least 2 characters.");
      setSaving(false);
      return;
    }

    try {
      if (form.id) {
        const response = await API.put(`/services/${form.id}`, {
          name,
        });
        setServices((current) =>
          current.map((service) => (service.id === form.id ? response.data : service))
        );
      } else {
        const response = await API.post("/services", {
          name,
        });
        setServices((current) => [response.data, ...current]);
      }

      closeModal();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save service.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service) => {
    setForm(service);
    setError("");
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/services/${deleteId}`);
      setServices((current) => current.filter((service) => service.id !== deleteId));
      setDeleteId(null);
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete service.");
    }
  };

  const filteredServices = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return services;
    }

    return services.filter((service) =>
      service.name.toLowerCase().includes(keyword)
    );
  }, [search, services]);

  const statCards = [
    {
      label: "Total Services",
      value: services.length,
      icon: Activity,
      tone: "bg-cyan-50 text-cyan-700",
    },
    {
      label: "Visible Results",
      value: filteredServices.length,
      icon: Search,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Clinic Ready",
      value: services.length ? "Active" : "Setup",
      icon: Sparkles,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="motion-panel overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.22),_transparent_30%),linear-gradient(135deg,#0f172a,#111827,#0b3b2e)] px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Treatment Catalog
              </p>
              <div>
                <h1 className="text-2xl font-semibold">Services</h1>
                <p className="mt-1 max-w-2xl text-sm text-white/75">
                  Shape a polished care catalog for your clinic, keep treatments
                  organized, and update offerings from one modern workspace.
                </p>
              </div>
            </div>

            {canAddServices ? (
              <button
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                <Plus size={16} /> Add Service
              </button>
            ) : null}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="stagger-grid grid gap-4 md:grid-cols-3">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="motion-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {loading ? "..." : value}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${tone}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="motion-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Service Library
              </h2>
              <p className="text-sm text-slate-500">
                Search, review, edit, and remove treatment offerings.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search services"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          {!loading && filteredServices.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                <Wrench size={26} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                {services.length === 0 ? "No services added yet" : "No matching services"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {services.length === 0
                  ? "Create your first treatment or care service to populate this library."
                  : "Try a different keyword or clear the search to see all services."}
              </p>
              {services.length === 0 && canAddServices ? (
                <button
                  onClick={openAddModal}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Plus size={16} /> Add First Service
                </button>
              ) : null}
            </div>
          ) : (
            <div className="stagger-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service, index) => (
                <div
                  key={service.id}
                  className="motion-card group rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Activity size={22} />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Service {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {service.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Available for scheduling, treatment planning, and clinic
                        management workflows.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      ID #{service.id.slice(-6)}
                    </span>

                    {canEditServices ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100"
                          title="Edit service"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => setDeleteId(service.id)}
                          className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100"
                          title="Delete service"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (canAddServices || canEditServices) ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="motion-card w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-5">
                <p className="text-sm font-medium text-emerald-600">Service Form</p>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {form.id ? "Edit Service" : "Add Service"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Keep the service name clear and patient-friendly so the admin
                  team can identify it quickly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Service Name
                  </label>
                  <input
                    type="text"
                    placeholder="Example: Sports Injury Therapy"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-900 px-5 py-2 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : form.id ? "Update Service" : "Save Service"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {deleteId && canEditServices ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="motion-card w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-medium text-rose-600">Delete Service</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                Remove This Service?
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                This will remove the service from the current library view. Make
                sure it is no longer needed before you continue.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-medium text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
