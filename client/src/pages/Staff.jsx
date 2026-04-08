import { useEffect, useMemo, useState } from "react";
import Pagination from "../components/Pagination";
import DashboardLayout from "../layout/DashboardLayout";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  Users,
  ShieldCheck,
  BriefcaseBusiness,
} from "lucide-react";
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

const STAFF_TYPE_OPTIONS = [
  "Receptionist",
  "Doctor",
  "Physiotherapist",
  "Marketing Executive",
  "Accountant",
  "Front Desk",
  "Therapist",
  "Support Staff",
];

export default function Staff() {
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const canAddStaff = canAddModule("staff", currentUser);
  const canEditStaff = canEditModule("staff", currentUser);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    mobile: "",
    role: "Staff",
    status: "Active",
    chatEnabled: false,
    workType: "",
    password: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);

  const loadStaff = async () => {
    try {
      const response = await API.get("/users");
      setStaffList(response.data);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      email: "",
      mobile: "",
      role: "Staff",
      status: "Active",
      chatEnabled: false,
      workType: "",
      password: "",
    });
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

    const validationError = firstValidationError([
      !form.name.trim() ? "Staff name is required." : "",
      validateEmailField(form.email),
      validatePhoneField(form.mobile),
      form.password && form.password.length < 6
        ? "Password must be at least 6 characters."
        : "",
    ]);

    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      if (form.id) {
        await API.put(`/users/${form.id}`, {
          name: form.name.trim(),
          email: cleanEmail(form.email),
          mobile: cleanPhone(form.mobile),
          role: form.role,
          status: form.status,
          chatEnabled: form.chatEnabled,
          workType: form.workType,
          password: form.password,
        });
      } else {
        await API.post("/users", {
          name: form.name.trim(),
          email: cleanEmail(form.email),
          mobile: cleanPhone(form.mobile),
          role: form.role,
          status: form.status,
          chatEnabled: form.chatEnabled,
          workType: form.workType,
          password: form.password,
        });
      }

      await loadStaff();
      closeModal();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save staff member.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (staff) => {
    setForm({ ...staff, password: "" });
    setError("");
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/users/${deleteId}`);
      setStaffList((current) => current.filter((staff) => staff.id !== deleteId));
      setDeleteId(null);
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete staff member.");
    }
  };

  const filteredStaff = useMemo(() => {
    const keyword = search.toLowerCase();
    return staffList.filter((staff) => {
      if (staff.role === "Admin") {
        return false;
      }

      return (
        staff.name.toLowerCase().includes(keyword) ||
        staff.email.toLowerCase().includes(keyword) ||
        staff.mobile.includes(keyword) ||
        staff.role.toLowerCase().includes(keyword) ||
        String(staff.status || "").toLowerCase().includes(keyword) ||
        String(staff.workType || "").toLowerCase().includes(keyword)
      );
    });
  }, [search, staffList]);

  const adminCount = staffList.filter((staff) => staff.role === "Admin").length;
  const activeStaff = filteredStaff.filter((staff) => staff.status !== "Inactive");
  const inactiveStaff = filteredStaff.filter((staff) => staff.status === "Inactive");
  const activeCount = staffList.filter(
    (staff) => staff.role !== "Admin" && staff.status !== "Inactive"
  ).length;

  useEffect(() => {
    setActivePage(1);
    setInactivePage(1);
  }, [search]);

  const activeTotalPages = Math.max(1, Math.ceil(activeStaff.length / PAGE_SIZE));
  const inactiveTotalPages = Math.max(1, Math.ceil(inactiveStaff.length / PAGE_SIZE));

  const paginatedActiveStaff = useMemo(() => {
    const startIndex = (activePage - 1) * PAGE_SIZE;
    return activeStaff.slice(startIndex, startIndex + PAGE_SIZE);
  }, [activePage, activeStaff]);

  const paginatedInactiveStaff = useMemo(() => {
    const startIndex = (inactivePage - 1) * PAGE_SIZE;
    return inactiveStaff.slice(startIndex, startIndex + PAGE_SIZE);
  }, [inactivePage, inactiveStaff]);

  useEffect(() => {
    if (activePage > activeTotalPages) {
      setActivePage(activeTotalPages);
    }
  }, [activePage, activeTotalPages]);

  useEffect(() => {
    if (inactivePage > inactiveTotalPages) {
      setInactivePage(inactiveTotalPages);
    }
  }, [inactivePage, inactiveTotalPages]);

  const statCards = [
    {
      label: "Team Members",
      value: staffList.length,
      icon: Users,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Hidden Admins",
      value: adminCount,
      icon: ShieldCheck,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Active Staff",
      value: activeCount,
      icon: BriefcaseBusiness,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  const renderStaffTable = (
    title,
    subtitle,
    rows,
    emptyText,
    currentPage,
    onPageChange,
    totalPages,
    totalItems
  ) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {rows.length} staff
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">No.</th>
                <th className="px-5 py-4 font-medium">Staff Member</th>
                <th className="px-5 py-4 font-medium">Email</th>
                <th className="px-5 py-4 font-medium">Mobile</th>
                <th className="px-5 py-4 font-medium">Work Type</th>
                <th className="px-5 py-4 font-medium">Website Chat</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-14 text-center text-sm text-slate-500">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                rows.map((staff, index) => (
                  <tr key={staff.id} className="bg-white transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-600">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 font-semibold text-indigo-600">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{staff.name}</p>
                          <p className="text-sm text-slate-500">Staff ID #{staff.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{staff.email}</td>
                    <td className="px-5 py-4 text-slate-600">{staff.mobile}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {staff.workType || "Not set"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                          staff.chatEnabled
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {staff.chatEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                          staff.status === "Inactive"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {staff.status || "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/staff/${staff.id}`)}
                          className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          title="Open staff profile"
                        >
                          <Eye size={17} />
                        </button>

                        {canEditStaff ? (
                          <>
                            <button
                              onClick={() => handleEdit(staff)}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"
                              title="Edit staff"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() => setDeleteId(staff.id)}
                              className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                              title="Delete staff"
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
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={onPageChange}
        label="staff"
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="motion-panel rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-indigo-950 to-sky-900 px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Team Directory
              </p>
              <div>
                <h1 className="text-2xl font-semibold">Staff</h1>
                <p className="mt-1 max-w-2xl text-sm text-white/75">
                  Manage admin and staff accounts, update contact details, and
                  keep your clinic team organized from one clean workspace.
                </p>
              </div>
            </div>

            {canAddStaff ? (
              <button
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
              >
                <Plus size={16} /> Add Staff
              </button>
            ) : null}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
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

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Staff Search</h2>
              <p className="text-sm text-slate-500">
                Search active and inactive staff. Admin accounts are hidden from this page.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by name, email, mobile, or role"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {renderStaffTable(
          "Active Staff",
          "Currently working staff members.",
          paginatedActiveStaff,
          "No active staff found for your search.",
          activePage,
          setActivePage,
          activeTotalPages,
          activeStaff.length
        )}

        {renderStaffTable(
          "Inactive Staff",
          "Staff members who are currently inactive.",
          paginatedInactiveStaff,
          "No inactive staff found for your search.",
          inactivePage,
          setInactivePage,
          inactiveTotalPages,
          inactiveStaff.length
        )}

        {showModal && (canAddStaff || canEditStaff) ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-5">
                <p className="text-sm font-medium text-blue-600">Staff Form</p>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {form.id ? "Edit Staff" : "Add Staff"}
                </h3>
              </div>

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

                <select
                  className="input"
                  value={form.workType}
                  onChange={(e) => setForm({ ...form, workType: e.target.value })}
                >
                  <option value="">Select work type</option>
                  {STAFF_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option>Admin</option>
                  <option>Staff</option>
                </select>

                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form.chatEnabled)}
                    onChange={(e) => setForm({ ...form, chatEnabled: e.target.checked })}
                  />
                  Enable website chat for this staff
                </label>

                <input
                  type="password"
                  placeholder={form.id ? "New password (leave blank to keep current)" : "Password"}
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!form.id}
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

        {deleteId && canEditStaff ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-medium text-rose-600">Delete Staff</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                Confirm Delete
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Are you sure you want to delete this staff member? This action
                will remove the person from the current team list.
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
