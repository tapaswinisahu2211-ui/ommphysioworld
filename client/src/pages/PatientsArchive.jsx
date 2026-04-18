import { useEffect, useMemo, useState } from "react";
import { Archive, ArrowLeft, RotateCcw, Search, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function PatientsArchive() {
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [restoringId, setRestoringId] = useState("");

  const loadArchivedPatients = async () => {
    try {
      const response = await API.get("/patients/archive");
      setPatients(response.data);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load archived patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return patients;
    }

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

  const handlePermanentDelete = async () => {
    try {
      await API.delete(`/patients/${deleteId}/permanent`);
      setPatients((current) => current.filter((patient) => patient.id !== deleteId));
      setDeleteId(null);
      setError("");
    } catch (deleteError) {
      setError(
        deleteError.response?.data?.message ||
          "Failed to permanently delete archived patient."
      );
    }
  };

  const handleRestore = async (patientId) => {
    try {
      setRestoringId(patientId);
      const response = await API.patch(`/patients/${patientId}/restore`);
      setPatients((current) => current.filter((patient) => patient.id !== patientId));
      setError("");

      if (response.data?.patient?.id) {
        navigate("/patients");
      }
    } catch (restoreError) {
      setError(
        restoreError.response?.data?.message ||
          "Failed to restore archived patient."
      );
    } finally {
      setRestoringId("");
    }
  };

  const statCards = [
    {
      label: "Archived Patients",
      value: patients.length,
      icon: Archive,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Visible Results",
      value: filteredPatients.length,
      icon: Users,
      tone: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="motion-panel rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-950 via-slate-900 to-rose-900 px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Patient Archive
              </p>
              <div>
                <h1 className="text-2xl font-semibold">Archived Patients</h1>
                <p className="mt-1 max-w-2xl text-sm text-white/75">
                  Archived patients stay hidden from active modules. Admin can
                  permanently delete them from here when needed.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/patients")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft size={16} /> Back to Patients
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

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
                Archive List
              </h2>
              <p className="text-sm text-slate-500">
                Search archived patients and permanently delete them if required.
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
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">No.</th>
                    <th className="px-5 py-4 font-medium">Patient</th>
                    <th className="px-5 py-4 font-medium">Email</th>
                    <th className="px-5 py-4 font-medium">Mobile</th>
                    <th className="px-5 py-4 font-medium">Archived At</th>
                    <th className="px-5 py-4 font-medium text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {!loading && filteredPatients.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-5 py-14 text-center text-sm text-slate-500"
                      >
                        No archived patients found for your search.
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
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 font-semibold text-amber-700">
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
                        <td className="px-5 py-4 text-slate-600">
                          {formatDateTime(patient.archivedAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleRestore(patient.id)}
                              disabled={restoringId === patient.id}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Restore patient"
                            >
                              <RotateCcw size={17} />
                            </button>
                            <button
                              onClick={() => setDeleteId(patient.id)}
                              className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                              title="Delete permanently"
                            >
                              <Trash2 size={17} />
                            </button>
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
            label="archived patients"
          />
        </div>

        {deleteId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="motion-card w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-medium text-rose-600">
                Permanent Delete
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                Delete Archived Patient
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                This will permanently remove the archived patient record. This
                action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handlePermanentDelete}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-medium text-white hover:bg-rose-700"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
