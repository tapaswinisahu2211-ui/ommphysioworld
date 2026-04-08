import { useEffect, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Pencil, X } from "lucide-react";
import API from "../services/api";
import { setStoredUser } from "../utils/auth";
import {
  cleanEmail,
  cleanPhone,
  firstValidationError,
  validateEmailField,
  validatePhoneField,
} from "../utils/validation";

export default function AdminProfile() {
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "Admin",
    workType: "",
    chatEnabled: false,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await API.get("/admin/profile");
        setAdmin(response.data);
        setForm(response.data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Failed to load admin profile.");
      }
    };

    loadProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!admin) return;

    setSaving(true);
    setError("");

    const validationError = firstValidationError([
      !form.name.trim() ? "Name is required." : "",
      validateEmailField(form.email),
      validatePhoneField(form.mobile),
    ]);

    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      const response = await API.put(`/admin/profile/${admin.id}`, {
        name: form.name.trim(),
        email: cleanEmail(form.email),
        mobile: cleanPhone(form.mobile),
        workType: form.workType,
        chatEnabled: form.chatEnabled,
      });
      setAdmin(response.data);
      setForm(response.data);
      setStoredUser(response.data);
      setEditOpen(false);
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to update admin profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!admin) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Admin Profile</h2>
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
              Loading profile...
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Admin Profile</h2>
          <p className="text-sm text-gray-400">Manage your account</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-6 flex items-center gap-6 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
            {admin.name[0]}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{admin.name}</h3>
            <p className="text-gray-400">{admin.email}</p>
            <p className="mt-1 text-gray-400">{admin.mobile}</p>
            <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600">
              {admin.role}
            </span>
            <span className="ml-2 rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
              {admin.chatEnabled ? "Website Chat Enabled" : "Website Chat Disabled"}
            </span>
          </div>

          <button onClick={() => setEditOpen(true)} className="btn-primary">
            <Pencil size={14} /> Edit
          </button>
        </div>

        <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Account Details</h3>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-gray-400">Full Name</p>
              <p className="font-medium">{admin.name}</p>
            </div>

            <div>
              <p className="text-gray-400">Email</p>
              <p className="font-medium">{admin.email}</p>
            </div>

            <div>
              <p className="text-gray-400">Mobile</p>
              <p className="font-medium">{admin.mobile}</p>
            </div>

            <div>
              <p className="text-gray-400">Role</p>
              <p className="font-medium">{admin.role}</p>
            </div>
            <div>
              <p className="text-gray-400">Work Type</p>
              <p className="font-medium">{admin.workType || "Not set"}</p>
            </div>
            <div>
              <p className="text-gray-400">Website Chat</p>
              <p className="font-medium">{admin.chatEnabled ? "Enabled" : "Disabled"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Security</h3>

          <button className="btn-secondary">Change Password</button>
        </div>

        {editOpen && (
          <div className="fixed inset-0 z-50 flex bg-black/40">
            <div className="flex-1" onClick={() => setEditOpen(false)} />

            <div className="drawer animate-slideIn">
              <button className="close-btn" onClick={() => setEditOpen(false)}>
                <X />
              </button>

              <h3 className="mb-4 text-lg font-semibold">Edit Profile</h3>

              <form onSubmit={handleUpdate} className="space-y-3">
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Name"
                />

                <input
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                />

                <input
                  className="input"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="Mobile"
                />

                <input
                  className="input"
                  value={form.workType || ""}
                  onChange={(e) => setForm({ ...form, workType: e.target.value })}
                  placeholder="Work type"
                />

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form.chatEnabled)}
                    onChange={(e) => setForm({ ...form, chatEnabled: e.target.checked })}
                  />
                  Show admin in website chat when online
                </label>

                <button disabled={saving} className="btn-primary w-full disabled:opacity-60">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
