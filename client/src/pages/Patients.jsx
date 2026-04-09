import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination";
import DashboardLayout from "../layout/DashboardLayout";
import { Eye, Pencil, Trash2, Plus, Search, Users, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { canAddModule, canEditModule, getStoredUser } from "../utils/auth";
import {
  cleanEmail,
  cleanPhone,
  firstValidationError,
  validateEmailField,
  validatePhoneField,
} from "../utils/validation";

export default function Patients() {
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const canAddPatients = canAddModule("patients", currentUser);
  const canEditPatients = canEditModule("patients", currentUser);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    mobile: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadPatients = async () => {
    try {
      const response = await API.get("/patients");
      setPatients(response.data);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const resetForm = () => {
    setForm({ id: null, name: "", email: "", mobile: "" });
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setError("");
    setModalError("");
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setModalError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError("");

    const validationError = firstValidationError([
      !form.name.trim() ? "Patient name is required." : "",
      validateEmailField(form.email),
      validatePhoneField(form.mobile),
    ]);

    if (validationError) {
      setModalError(validationError);
      setSaving(false);
      return;
    }

    try {
      if (form.id) {
        await API.put(`/patients/${form.id}`, {
          name: form.name.trim(),
          email: cleanEmail(form.email),
          mobile: cleanPhone(form.mobile),
        });
      } else {
        await API.post("/patients", {
          name: form.name.trim(),
          email: cleanEmail(form.email),
          mobile: cleanPhone(form.mobile),
        });
      }

      await loadPatients();
      closeModal();
    } catch (saveError) {
      setModalError(saveError.response?.data?.message || "Failed to save patient.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (patient) => {
    setForm(patient);
    setError("");
    setModalError("");
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/patients/${deleteId}`);
      setPatients((current) => current.filter((patient) => patient.id !== deleteId));
      setDeleteId(null);
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete patient.");
    }
  };

  const filteredPatients = useMemo(() => {
    const keyword = search.toLowerCase();
    return patients.filter((patient) => {
      return (
        patient.name.toLowerCase().includes(keyword) ||
        patient.email.toLowerCase().includes(keyword) ||
        patient.mobile.includes(keyword)
      );
    });
  }, [patients, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredPatients.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredPatients]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const statCards = [
    {
      label: "Total Patients",
      value: patients.length,
      icon: Users,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Visible Results",
      value: filteredPatients.length,
      icon: UserPlus,
      tone: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="motion-panel rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-900 px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Patient Directory
              </p>
              <div>
                <h1 className="text-2xl font-semibold">Patients</h1>
                <p className="mt-1 max-w-2xl text-sm text-white/75">
                  Manage patient records, review contact details, and quickly open
                  individual profiles from one clean dashboard.
                </p>
              </div>
            </div>

            {canAddPatients ? (
              <button
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
              >
                <Plus size={16} /> Add Patient
              </button>
            ) : null}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="stagger-grid grid gap-4 md:grid-cols-2">
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
                Patient List
              </h2>
              <p className="text-sm text-slate-500">
                Search, review, edit, or open a patient profile.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by name, email, or mobile"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">No.</th>
                    <th className="px-5 py-4 font-medium">Patient</th>
                    <th className="px-5 py-4 font-medium">Email</th>
                    <th className="px-5 py-4 font-medium">Mobile</th>
                    <th className="px-5 py-4 font-medium text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {!loading && filteredPatients.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-5 py-14 text-center text-sm text-slate-500"
                      >
                        No patients found for your search.
                      </td>
                    </tr>
                  ) : (
                    paginatedPatients.map((patient, index) => (
                      <tr
                        key={patient.id}
                        className="bg-white transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-medium text-slate-600">
                          {(currentPage - 1) * PAGE_SIZE + index + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 font-semibold text-blue-600">
                              {patient.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {patient.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                ID #{patient.id.slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {patient.email}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {patient.mobile}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/patients/${patient.id}`)}
                              className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                              title="View profile"
                            >
                              <Eye size={17} />
                            </button>

                            {canEditPatients ? (
                              <>
                                <button
                                  onClick={() => handleEdit(patient)}
                                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
                                  title="Edit patient"
                                >
                                  <Pencil size={17} />
                                </button>

                                <button
                                  onClick={() => setDeleteId(patient.id)}
                                  className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                                  title="Delete patient"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPatients.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="patients"
          />
        </div>

        {showModal && (canAddPatients || canEditPatients) ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="motion-card w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Patient Form
                  </p>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {form.id ? "Edit Patient" : "Add Patient"}
                  </h3>
                </div>
              </div>

              {modalError ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {modalError}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />

                <input
                  type="email"
                  placeholder="Email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />

                <input
                  type="text"
                  placeholder="Mobile"
                  className="input"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  required
                />

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
                    className="rounded-xl bg-slate-900 px-5 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {deleteId && canEditPatients ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="motion-card w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-medium text-rose-600">Delete Patient</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                Confirm Delete
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Are you sure you want to delete this patient? This action will
                remove the record from the current list.
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
