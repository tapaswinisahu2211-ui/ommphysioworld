import {
  Camera,
  CalendarDays,
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import API from "../services/api";
import { clearPatientUser, getPatientUser, savePatientUser } from "../utils/patientAuth";
import { cleanPhone, validatePhoneField } from "../utils/validation";

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PatientProfilePage() {
  const navigate = useNavigate();
  const [patientUser, setPatientUser] = useState(() => getPatientUser());
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    disease: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  const patientId = patientUser?.patientId || "";

  const createdFromLabel = useMemo(() => {
    switch (patient?.createdFrom) {
      case "mobile_app":
        return "Mobile App";
      case "website":
        return "Website";
      default:
        return "Admin";
    }
  }, [patient?.createdFrom]);

  const imageUrl = useMemo(() => {
    if (!patient?.profileImageUrl) {
      return "";
    }

    const cacheKey = patient.profileImageUpdatedAt || Date.now();
    return `${API.defaults.baseURL}${patient.profileImageUrl}?v=${encodeURIComponent(cacheKey)}`;
  }, [patient]);

  const loadPatient = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await API.get(`/patients/${patientId}`);
      setPatient(response.data);
      setForm({
        name: response.data.name || "",
        email: response.data.email || "",
        mobile: response.data.mobile || "",
        disease: response.data.disease || "",
      });
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to load profile.",
      });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientUser) {
      navigate("/patient-login?redirect=/patient-profile", { replace: true });
      return;
    }

    loadPatient();
  }, [loadPatient, navigate, patientUser]);

  const handleLogout = () => {
    clearPatientUser();
    setPatientUser(null);
    navigate("/patient-login?redirect=/patient-dashboard", { replace: true });
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setStatus({ type: "error", message: "Full name is required." });
      return;
    }

    if (form.name.trim().length < 2) {
      setStatus({ type: "error", message: "Full name must be at least 2 characters." });
      return;
    }

    const phoneError = validatePhoneField(form.mobile);
    if (phoneError) {
      setStatus({ type: "error", message: phoneError });
      return;
    }

    try {
      setSaving(true);
      const response = await API.put(`/patients/${patientId}`, {
        name: form.name.trim(),
        mobile: cleanPhone(form.mobile),
        disease: form.disease.trim(),
      });
      setPatient(response.data);
      const nextUser = {
        ...patientUser,
        name: response.data.name,
        email: response.data.email,
        mobile: response.data.mobile,
        createdFrom: response.data.createdFrom,
      };
      savePatientUser(nextUser);
      setPatientUser(nextUser);
      setStatus({ type: "success", message: "Profile details updated." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setStatus({ type: "error", message: "Please fill in all password fields." });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus({ type: "error", message: "New password and confirm password must match." });
      return;
    }

    try {
      setChangingPassword(true);
      const response = await API.post("/auth/change-password", passwordForm);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStatus({
        type: "success",
        message:
          response.data?.message ||
          "Password changed successfully. The updated password has been sent to your email.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUploadImage = async () => {
    if (!profileImage) {
      setStatus({ type: "error", message: "Please choose a profile image first." });
      return;
    }

    try {
      setUploading(true);
      const payload = new FormData();
      payload.append("image", profileImage);
      const response = await API.post(`/patients/${patientId}/profile-image`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPatient(response.data);
      setProfileImage(null);
      setStatus({ type: "success", message: "Profile image updated." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to upload profile image.",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!patientUser) {
    return null;
  }

  return (
    <PublicLayout>
      <Seo
        title="Patient Profile"
        description="Manage your OPW patient profile details and account information."
        path="/patient-profile"
        robots="noindex, nofollow"
      />
      <section className="page-section mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-800 px-6 py-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%)]" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                Patient Profile
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {patientUser.name || "Patient"} account
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Manage your basic profile details and profile image for OMM Physio World.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>

        {status.message ? (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading profile...
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4 text-left lg:flex-col lg:text-center">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[28px] bg-sky-50 ring-4 ring-sky-50">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={patient?.name || "Patient profile"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sky-700">
                      <UserCircle2 size={48} />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {patient?.name || patientUser.name || "Patient"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {patient?.email || patientUser.email}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <label className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-600">
                  <Camera className="mx-auto mb-1 text-sky-700" size={20} />
                  {profileImage ? profileImage.name : "Choose profile image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      setProfileImage(event.target.files?.[0] || null)
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploading}
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </button>
              </div>

              <div className="mt-5 grid gap-2 text-sm">
                <InfoPill icon={Mail} label={patient?.email || "Email not added"} />
                <InfoPill icon={Phone} label={patient?.mobile || "Mobile not added"} />
                <InfoPill
                  icon={CalendarDays}
                  label={`Joined ${formatDate(patient?.createdAt)}`}
                />
                <InfoPill icon={ShieldCheck} label={`Created from ${createdFromLabel}`} />
              </div>
            </div>

            <div className="grid gap-5">
              <form
                onSubmit={handleSaveProfile}
                className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-xl font-semibold text-slate-950">
                  Patient Details
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  You can update your name, mobile number, and disease or concern here.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <input
                    className="input rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    required
                  />
                  <input
                    type="email"
                    className="input rounded-2xl border-slate-200 bg-slate-100 text-slate-400"
                    placeholder="Email Address"
                    value={form.email}
                    disabled
                    readOnly
                  />
                  <input
                    className="input rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="Mobile Number"
                    value={form.mobile}
                    onChange={(event) => setForm({ ...form, mobile: event.target.value })}
                    required
                  />
                  <input
                    className="input rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="Disease / Concern"
                    value={form.disease}
                    onChange={(event) => setForm({ ...form, disease: event.target.value })}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Created from: <span className="font-semibold text-slate-900">{createdFromLabel}</span>
                </div>

                <button
                  disabled={saving}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>

              <form
                onSubmit={handleChangePassword}
                className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      Change Password
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Your updated password will also be sent to your email.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <input
                    type="password"
                    className="input rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="Old Password"
                    value={passwordForm.oldPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, oldPassword: event.target.value })
                    }
                  />
                  <input
                    type="password"
                    className="input rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="New Password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                    }
                  />
                  <input
                    type="password"
                    className="input rounded-2xl border-slate-200 bg-slate-50"
                    placeholder="Confirm New Password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: event.target.value,
                      })
                    }
                  />
                </div>

                <button
                  disabled={changingPassword}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-sky-700 px-6 py-4 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
                >
                  <KeyRound size={18} />
                  {changingPassword ? "Updating..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

function InfoPill({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-slate-600">
      <Icon size={17} className="text-sky-700" />
      <span className="truncate">{label}</span>
    </div>
  );
}
