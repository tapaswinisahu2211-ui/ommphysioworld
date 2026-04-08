import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Download, Eye, FileText, Pencil, Plus, Save, ShieldCheck, Trash2, UserCircle2 } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";
import { canAddModule, canEditModule, getStoredUser, setStoredUser } from "../utils/auth";

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

const MODULE_LABELS = {
  dashboard: "Dashboard",
  patients: "Patients",
  appointments: "Appointments",
  documents: "Patient Documents",
  chat: "Chat",
  services: "Services",
  staff: "Staff",
  mailbox: "Mailbox",
  treatment_tracker: "Treatment Tracker",
};

export default function StaffProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const profileId = id || currentUser.id;
  const isSelfProfile = !id || currentUser.id === id;
  const canEditStaff = canEditModule("staff", currentUser);
  const canAddStaff = canAddModule("staff", currentUser);
  const [staff, setStaff] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "Staff",
    status: "Active",
    chatEnabled: false,
    workType: "",
    joiningDate: "",
    joiningNotes: "",
  });
  const [joiningDocuments, setJoiningDocuments] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    if (!profileId) {
      setError("Staff profile not found.");
      setLoading(false);
      return;
    }

    try {
      const response = await API.get(`/users/${profileId}`);
      setStaff(response.data);
      setPermissions(response.data.permissions || []);
      setJoiningDocuments(response.data.joiningDocuments || []);
      if (isSelfProfile) {
        setStoredUser(response.data);
      }
      setForm({
        name: response.data.name,
        email: response.data.email,
        mobile: response.data.mobile,
        role: response.data.role,
        status: response.data.status || "Active",
        chatEnabled: Boolean(response.data.chatEnabled),
        workType: response.data.workType || "",
        joiningDate: response.data.joiningDate || "",
        joiningNotes: response.data.joiningNotes || "",
      });
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load staff profile.");
    } finally {
      setLoading(false);
    }
  }, [isSelfProfile, profileId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const permissionStats = useMemo(() => {
    const viewCount = permissions.filter((item) => item.view).length;
    const addCount = permissions.filter((item) => item.add).length;
    const editCount = permissions.filter((item) => item.edit).length;

    return [
      { label: "View Access", value: viewCount, icon: Eye, tone: "bg-blue-50 text-blue-600" },
      { label: "Add Access", value: addCount, icon: Plus, tone: "bg-emerald-50 text-emerald-600" },
      { label: "Edit Access", value: editCount, icon: Pencil, tone: "bg-amber-50 text-amber-600" },
    ];
  }, [permissions]);

  const updatePermission = (module, field, value) => {
    setPermissions((current) =>
      current.map((item) =>
        item.module === module
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await API.put(`/users/${profileId}`, {
        ...form,
        permissions,
      });
      setStaff(response.data);
      setPermissions(response.data.permissions || []);
      setJoiningDocuments(response.data.joiningDocuments || []);
      if (isSelfProfile) {
        setStoredUser(response.data);
      }
      setError("");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save staff profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocuments = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();
      uploadFiles.forEach((file) => payload.append("documents", file));

      const response = await API.post(`/users/${profileId}/joining-documents`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setStaff(response.data);
      setJoiningDocuments(response.data.joiningDocuments || []);
      setUploadFiles([]);
      setError("");
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || "Failed to upload joining documents.");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      const response = await API.delete(`/users/${profileId}/joining-documents/${documentId}`);
      setStaff(response.data);
      setJoiningDocuments(response.data.joiningDocuments || []);
      setError("");
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete joining document.");
    }
  };

  const handleUploadProfileImage = async (e) => {
    e.preventDefault();

    if (!profileImageFile) {
      return;
    }

    try {
      const payload = new FormData();
      payload.append("image", profileImageFile);

      const response = await API.post(`/users/${profileId}/profile-image`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setStaff(response.data);
      setProfileImageFile(null);
      if (isSelfProfile) {
        setStoredUser(response.data);
      }
      setError("");
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || "Failed to upload profile image.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
          Loading staff profile...
        </div>
      </DashboardLayout>
    );
  }

  if (!staff) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
            <button
              onClick={() => navigate(canEditStaff ? "/staff" : "/dashboard")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
            <ArrowLeft size={16} /> {canEditStaff ? "Back to Staff" : "Back to Dashboard"}
          </button>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error || "Staff member not found."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isSelfProfile && !canEditStaff) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-indigo-950 to-sky-900 px-5 py-4 text-white shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
                  {staff.profileImageUrl ? (
                    <img
                      src={`${API.defaults.baseURL}${staff.profileImageUrl}`}
                      alt={staff.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold">{staff.name.charAt(0)}</span>
                  )}
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/60">My Profile</p>
                  <h1 className="text-2xl font-semibold">{staff.name}</h1>
                  <p className="mt-1 text-sm text-white/75">
                    Basic staff profile details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Profile Picture</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload your profile photo.
              </p>

              <div className="mt-6 flex justify-center">
                <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-[32px] bg-slate-100">
                  {staff.profileImageUrl ? (
                    <img
                      src={`${API.defaults.baseURL}${staff.profileImageUrl}`}
                      alt={staff.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl font-semibold text-slate-500">
                      {staff.name.charAt(0)}
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleUploadProfileImage} className="mt-6 space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-slate-600"
                  onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                />
                <button
                  type="submit"
                  disabled={!profileImageFile}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Camera size={16} />
                  Upload Profile Picture
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Basic Details</h2>
              <p className="mt-1 text-sm text-slate-500">
                View your staff account details.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
                  <p className="mt-2 font-medium text-slate-900">{staff.name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                  <p className="mt-2 font-medium text-slate-900">{staff.email}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
                  <p className="mt-2 font-medium text-slate-900">{staff.mobile}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-indigo-950 to-sky-900 px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
                <span className="text-2xl font-semibold">{staff.name.charAt(0)}</span>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={() => navigate(canEditStaff ? "/staff" : "/dashboard")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/90 hover:bg-white/15"
                >
                  <ArrowLeft size={16} />
                  {canEditStaff ? "Back to Staff" : "Back to Dashboard"}
                </button>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                    {isSelfProfile ? "My Profile" : "Staff Profile"}
                  </p>
                  <h1 className="text-2xl font-semibold">{staff.name}</h1>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-white/75">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <UserCircle2 size={14} />
                    {staff.role}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <FileText size={14} />
                    {staff.workType || "Work type not set"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <ShieldCheck size={14} />
                    {staff.status || "Active"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <FileText size={14} />
                    Staff ID #{staff.id.slice(-6)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              form="staff-profile-form"
              disabled={!canEditStaff || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              <Save size={16} />
              Save Permissions
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {permissionStats.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
                </div>
                <div className={`rounded-2xl p-3 ${tone}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <form id="staff-profile-form" onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Staff Details</h2>
              <p className="text-sm text-slate-500">Update basic contact information and role.</p>
            </div>

            <div className="space-y-4">
              <input
                className="input"
                placeholder="Name"
                value={form.name}
                disabled={!canEditStaff}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Email"
                value={form.email}
                disabled={!canEditStaff}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Mobile"
                value={form.mobile}
                disabled={!canEditStaff}
                onChange={(e) => setForm((current) => ({ ...current, mobile: e.target.value }))}
              />
              <select
                className="input"
                value={form.workType}
                disabled={!canEditStaff}
                onChange={(e) => setForm((current) => ({ ...current, workType: e.target.value }))}
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
                disabled={!canEditStaff}
                onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))}
              >
                <option>Admin</option>
                <option>Staff</option>
              </select>
              <select
                className="input"
                value={form.status}
                disabled={!canEditStaff}
                onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.chatEnabled)}
                  disabled={!canEditStaff}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, chatEnabled: e.target.checked }))
                  }
                />
                Enable website chat for this staff
              </label>
              <input
                type="date"
                className="input"
                value={form.joiningDate}
                disabled={!canEditStaff}
                onChange={(e) => setForm((current) => ({ ...current, joiningDate: e.target.value }))}
              />
              <textarea
                className="input min-h-[120px]"
                placeholder="Joining notes"
                value={form.joiningNotes}
                disabled={!canEditStaff}
                onChange={(e) => setForm((current) => ({ ...current, joiningNotes: e.target.value }))}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Appointment + Documents Note</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Give `Appointments` add/edit access if staff should add appointment details.
                    Give `Patient Documents` add/edit access if staff should manage patient documents and notes.
                  </p>
                </div>
              </div>
            </div>
            </form>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">Joining Documents</h2>
                <p className="text-sm text-slate-500">
                  Store staff joining documents and onboarding files on the staff profile.
                </p>
              </div>

              {canAddStaff || canEditStaff ? (
              <form onSubmit={handleUploadDocuments} className="rounded-2xl border border-dashed border-slate-300 p-4">
                <label className="block text-sm font-medium text-slate-700">
                  Upload joining documents
                </label>
                <input
                  type="file"
                  multiple
                  className="mt-3 block w-full text-sm text-slate-600"
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                />
                {uploadFiles.length ? (
                  <div className="mt-3 space-y-2">
                    {uploadFiles.map((file) => (
                      <p key={`${file.name}-${file.size}`} className="text-sm text-slate-500">
                        {file.name}
                      </p>
                    ))}
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={!uploadFiles.length}
                  className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Upload Documents
                </button>
              </form>
              ) : null}

              <div className="mt-5 space-y-3">
                {!joiningDocuments.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No joining documents uploaded yet.
                  </div>
                ) : (
                  joiningDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{document.name}</p>
                        <p className="text-sm text-slate-500">
                          Uploaded {new Date(document.uploadedAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`${API.defaults.baseURL}${document.downloadUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          title="Download document"
                        >
                          <Download size={17} />
                        </a>
                        {canEditStaff ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(document.id)}
                            className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                            title="Delete document"
                          >
                            <Trash2 size={17} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Module Permissions</h2>
              <p className="text-sm text-slate-500">Admin can choose view, add, and edit access for each module.</p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead className="bg-slate-50 text-sm text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Module</th>
                      <th className="px-5 py-4 font-medium text-center">View</th>
                      <th className="px-5 py-4 font-medium text-center">Add</th>
                      <th className="px-5 py-4 font-medium text-center">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {permissions.map((permission) => (
                      <tr key={permission.module} className="bg-white">
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {MODULE_LABELS[permission.module] || permission.module}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={permission.view}
                            disabled={!canEditStaff}
                            onChange={(e) =>
                              updatePermission(permission.module, "view", e.target.checked)
                            }
                          />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={permission.add}
                            disabled={!canEditStaff}
                            onChange={(e) =>
                              updatePermission(permission.module, "add", e.target.checked)
                            }
                          />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={permission.edit}
                            disabled={!canEditStaff}
                            onChange={(e) =>
                              updatePermission(permission.module, "edit", e.target.checked)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!canEditStaff || saving}
                className="rounded-xl bg-slate-900 px-5 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Staff Profile"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
