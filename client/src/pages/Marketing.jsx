import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  Camera,
  ClipboardPlus,
  Edit3,
  ImagePlus,
  MapPin,
  Phone,
  Plus,
  Search,
  Target,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";
import { canAddModule, canEditModule, getStoredUser } from "../utils/auth";
import {
  cleanEmail,
  cleanPhone,
  cleanText,
  validateEmailField,
  validatePhoneField,
} from "../utils/validation";

const SOURCE_TYPES = [
  { value: "medical_shop", label: "Medical Shop" },
  { value: "clinic", label: "Clinic" },
  { value: "institute", label: "Institute" },
  { value: "hospital", label: "Hospital" },
  { value: "doctor", label: "Doctor" },
  { value: "other", label: "Other" },
];

const PITCH_STATUSES = [
  { value: "new", label: "New Lead" },
  { value: "visited", label: "Visited" },
  { value: "interested", label: "Interested" },
  { value: "follow_up", label: "Follow-up" },
  { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not Interested" },
];

const emptyForm = {
  id: null,
  sourceType: "medical_shop",
  name: "",
  contactPerson: "",
  doctorName: "",
  mobile: "",
  alternateMobile: "",
  email: "",
  area: "",
  city: "",
  address: "",
  visitDate: "",
  nextFollowUpDate: "",
  assignedTo: "",
  pitchStatus: "new",
  expectedDailyPatients: "",
  notes: "",
  existingPhotos: [],
  removePhotoIds: [],
};

const todayInputValue = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

const sourceTypeLabel = (value) =>
  SOURCE_TYPES.find((item) => item.value === value)?.label || "Medical Shop";

const pitchStatusLabel = (value) =>
  PITCH_STATUSES.find((item) => item.value === value)?.label || "New Lead";

const formatDate = (value) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatSourceAddress = (source) =>
  [source.area, source.city, source.address].filter(Boolean).join(", ") || "Location not added";

const MarketingInput = ({ label, icon: Icon, className = "", ...props }) => (
  <label className={className}>
    <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
    <div className="relative">
      {Icon ? (
        <Icon
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      ) : null}
      <input
        {...props}
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100 ${
          Icon ? "pl-11" : ""
        } ${props.className || ""}`}
      />
    </div>
  </label>
);

export default function Marketing() {
  const currentUser = getStoredUser();
  const canAddMarketing = canAddModule("marketing", currentUser);
  const canEditMarketing = canEditModule("marketing", currentUser);
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [referralSource, setReferralSource] = useState(null);
  const [referralForm, setReferralForm] = useState({
    date: todayInputValue(),
    patientCount: "1",
    patientNames: "",
    notes: "",
  });
  const [deleteSourceId, setDeleteSourceId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSources = async () => {
    try {
      const response = await API.get("/marketing/sources");
      setSources(response.data || []);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load marketing sources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setPhotoFiles([]);
  };

  const closeSourceModal = () => {
    setShowSourceModal(false);
    resetForm();
    setError("");
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setShowSourceModal(true);
  };

  const openEditModal = (source) => {
    setForm({
      id: source.id,
      sourceType: source.sourceType || "medical_shop",
      name: source.name || "",
      contactPerson: source.contactPerson || "",
      doctorName: source.doctorName || "",
      mobile: source.mobile || "",
      alternateMobile: source.alternateMobile || "",
      email: source.email || "",
      area: source.area || "",
      city: source.city || "",
      address: source.address || "",
      visitDate: source.visitDate || "",
      nextFollowUpDate: source.nextFollowUpDate || "",
      assignedTo: source.assignedTo || source.marketingPerson || "",
      pitchStatus: source.pitchStatus || source.status || "new",
      expectedDailyPatients: source.expectedDailyPatients || "",
      notes: source.notes || "",
      existingPhotos: source.photos || [],
      removePhotoIds: [],
    });
    setPhotoFiles([]);
    setError("");
    setShowSourceModal(true);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const togglePhotoRemoval = (photoId) => {
    setForm((current) => {
      const exists = current.removePhotoIds.includes(photoId);
      return {
        ...current,
        removePhotoIds: exists
          ? current.removePhotoIds.filter((id) => id !== photoId)
          : [...current.removePhotoIds, photoId],
      };
    });
  };

  const validateSource = () => {
    const name = cleanText(form.name);

    if (name.length < 2) {
      return "Place or source name must be at least 2 characters.";
    }

    return (
      validatePhoneField(form.mobile, false) ||
      validatePhoneField(form.alternateMobile, false) ||
      validateEmailField(form.email, false)
    );
  };

  const handleSourceSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const validationError = validateSource();
    if (validationError) {
      setSaving(false);
      setError(validationError);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("sourceType", form.sourceType);
      payload.append("name", cleanText(form.name));
      payload.append("contactPerson", cleanText(form.contactPerson));
      payload.append("doctorName", cleanText(form.doctorName));
      payload.append("mobile", cleanPhone(form.mobile));
      payload.append("alternateMobile", cleanPhone(form.alternateMobile));
      payload.append("email", cleanEmail(form.email));
      payload.append("area", cleanText(form.area));
      payload.append("city", cleanText(form.city));
      payload.append("address", cleanText(form.address));
      payload.append("visitDate", form.visitDate || "");
      payload.append("nextFollowUpDate", form.nextFollowUpDate || "");
      payload.append("assignedTo", cleanText(form.assignedTo));
      payload.append("pitchStatus", form.pitchStatus);
      payload.append("expectedDailyPatients", form.expectedDailyPatients || 0);
      payload.append("notes", cleanText(form.notes));
      payload.append("removePhotoIds", JSON.stringify(form.removePhotoIds));
      photoFiles.forEach((file) => payload.append("photos", file));

      const request = form.id
        ? API.put(`/marketing/sources/${form.id}`, payload, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : API.post("/marketing/sources", payload, {
            headers: { "Content-Type": "multipart/form-data" },
          });
      const response = await request;

      setSources((current) =>
        form.id
          ? current.map((source) => (source.id === form.id ? response.data : source))
          : [response.data, ...current]
      );
      closeSourceModal();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save marketing source.");
    } finally {
      setSaving(false);
    }
  };

  const handleReferralSubmit = async (event) => {
    event.preventDefault();

    if (!referralSource) {
      return;
    }

    const patientCount = Number(referralForm.patientCount || 0);
    if (!Number.isFinite(patientCount) || patientCount < 0) {
      setError("Patient count cannot be negative.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await API.post(`/marketing/sources/${referralSource.id}/referrals`, {
        date: referralForm.date || todayInputValue(),
        patientCount,
        patientNames: referralForm.patientNames,
        notes: referralForm.notes,
      });

      setSources((current) =>
        current.map((source) =>
          source.id === referralSource.id ? response.data : source
        )
      );
      setReferralSource(null);
      setReferralForm({
        date: todayInputValue(),
        patientCount: "1",
        patientNames: "",
        notes: "",
      });
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to add daily patient record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReferral = async (sourceId, referralId) => {
    try {
      const response = await API.delete(
        `/marketing/sources/${sourceId}/referrals/${referralId}`
      );
      setSources((current) =>
        current.map((source) => (source.id === sourceId ? response.data : source))
      );
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete daily patient record.");
    }
  };

  const confirmDeleteSource = async () => {
    try {
      await API.delete(`/marketing/sources/${deleteSourceId}`);
      setSources((current) => current.filter((source) => source.id !== deleteSourceId));
      setDeleteSourceId(null);
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete marketing source.");
    }
  };

  const filteredSources = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return sources.filter((source) => {
      const matchesType = typeFilter === "all" || source.sourceType === typeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        source.pitchStatus === statusFilter ||
        source.status === statusFilter;
      const searchable = [
        source.name,
        source.contactPerson,
        source.doctorName,
        source.mobile,
        source.email,
        source.area,
        source.city,
        source.address,
        source.assignedTo,
      ]
        .join(" ")
        .toLowerCase();

      return matchesType && matchesStatus && (!keyword || searchable.includes(keyword));
    });
  }, [search, sources, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const today = todayInputValue();
    const todayPatients = sources.reduce(
      (sum, source) =>
        sum +
        (source.referrals || [])
          .filter((referral) => referral.date === today)
          .reduce((innerSum, referral) => innerSum + Number(referral.patientCount || 0), 0),
      0
    );
    const totalPatients = sources.reduce(
      (sum, source) => sum + Number(source.totalGeneratedPatients || 0),
      0
    );
    const activePartners = sources.filter((source) =>
      ["interested", "follow_up", "converted"].includes(source.pitchStatus || source.status)
    ).length;

    return [
      {
        label: "Marketing Sources",
        value: sources.length,
        icon: Building2,
        tone: "bg-teal-50 text-teal-700",
      },
      {
        label: "Active Partners",
        value: activePartners,
        icon: Users,
        tone: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Today Patients",
        value: todayPatients,
        icon: CalendarDays,
        tone: "bg-sky-50 text-sky-700",
      },
      {
        label: "Total Generated",
        value: totalPatients,
        icon: Target,
        tone: "bg-amber-50 text-amber-700",
      },
    ];
  }, [sources]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="motion-panel overflow-hidden rounded-[30px] border border-teal-100 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.24),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_34%),linear-gradient(135deg,#082f49,#0f766e,#134e4a)] p-5 text-white shadow-md md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.22em] text-white/60">
                Field Growth Desk
              </p>
              <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
                Marketing Visit Pipeline
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Track medical shops, clinics, institutes, doctor contacts,
                visit photos, follow-ups, and the daily patient referrals they
                generate for Omm Physio World.
              </p>
            </div>

            {canAddMarketing ? (
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                <Plus size={17} /> Add Source
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="stagger-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
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

        <div className="motion-card rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Source Directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search partner locations, filter by type or status, and update daily patient flow.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px] xl:w-[720px]">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search shop, clinic, doctor, area..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
              >
                <option value="all">All types</option>
                {SOURCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
              >
                <option value="all">All status</option>
                {PITCH_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!loading && filteredSources.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-teal-700 shadow-sm">
                <MegaphoneFallback />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                {sources.length ? "No matching marketing sources" : "No marketing sources yet"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {sources.length
                  ? "Try changing your search or filter."
                  : "Add the first medical shop, clinic, institute, or doctor contact to begin tracking referrals."}
              </p>
              {!sources.length && canAddMarketing ? (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Plus size={16} /> Add First Source
                </button>
              ) : null}
            </div>
          ) : (
            <div className="stagger-grid grid gap-4 xl:grid-cols-2">
              {filteredSources.map((source) => {
                const recentReferrals = (source.referrals || []).slice(-3).reverse();
                const activeStatus = source.pitchStatus || source.status || "new";

                return (
                  <article
                    key={source.id}
                    className="motion-card rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                            {sourceTypeLabel(source.sourceType)}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {pitchStatusLabel(activeStatus)}
                          </span>
                        </div>
                        <h3 className="truncate text-xl font-semibold text-slate-900">
                          {source.name}
                        </h3>
                        <p className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                          <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                          {formatSourceAddress(source)}
                        </p>
                      </div>

                      {canEditMarketing ? (
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(source)}
                            className="rounded-2xl border border-teal-200 bg-teal-50 p-2.5 text-teal-700 transition hover:bg-teal-100"
                            title="Edit source"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteSourceId(source.id)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 transition hover:bg-rose-100"
                            title="Delete source"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Contact
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {source.contactPerson || source.doctorName || "Not added"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {source.mobile || source.alternateMobile || "No mobile"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Follow-up
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {formatDate(source.nextFollowUpDate)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Visited {formatDate(source.visitDate)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Patients
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {source.totalGeneratedPatients || 0} generated
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Goal {source.expectedDailyPatients || 0}/day
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">
                            Daily Patient Records
                          </p>
                          {canAddMarketing ? (
                            <button
                              type="button"
                              onClick={() => setReferralSource(source)}
                              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                            >
                              <ClipboardPlus size={14} /> Add
                            </button>
                          ) : null}
                        </div>

                        {recentReferrals.length ? (
                          <div className="mt-3 space-y-2">
                            {recentReferrals.map((referral) => (
                              <div
                                key={referral.id}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm shadow-sm"
                              >
                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {referral.patientCount} patient{referral.patientCount === 1 ? "" : "s"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatDate(referral.date)}
                                    {referral.notes ? ` - ${referral.notes}` : ""}
                                  </p>
                                </div>
                                {canEditMarketing ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReferral(source.id, referral.id)}
                                    className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                    title="Delete daily record"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">
                            No daily patient records yet.
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Camera size={16} className="text-teal-700" /> Visit Photos
                        </div>
                        {source.photos?.length ? (
                          <div className="grid grid-cols-3 gap-2">
                            {source.photos.slice(0, 6).map((photo) => (
                              <MarketingPhoto
                                key={photo.id}
                                photo={photo}
                                alt={photo.name || source.name}
                                className="h-16 w-full rounded-2xl object-cover"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-24 items-center justify-center rounded-2xl bg-slate-50 text-xs text-slate-400">
                            No photos
                          </div>
                        )}
                      </div>
                    </div>

                    {source.notes ? (
                      <p className="mt-4 rounded-2xl bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
                        {source.notes}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {showSourceModal && (canAddMarketing || canEditMarketing) ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
            <div className="motion-card max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-[linear-gradient(135deg,#f0fdfa,#f8fafc)] px-6 py-5">
                <div>
                  <p className="text-sm font-semibold text-teal-700">
                    Marketing Source
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                    {form.id ? "Edit Source Details" : "Add New Source"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Capture the visit, doctor/contact details, photos, and referral expectations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSourceModal}
                  className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSourceSubmit} className="max-h-[calc(92vh-120px)] overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Source Type
                    </span>
                    <select
                      value={form.sourceType}
                      onChange={(event) => updateForm("sourceType", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    >
                      {SOURCE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <MarketingInput
                    label="Place / Source Name"
                    icon={Building2}
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    placeholder="Example: Sai Medical Store"
                    required
                  />

                  <MarketingInput
                    label="Marketing Person"
                    icon={UserRound}
                    value={form.assignedTo}
                    onChange={(event) => updateForm("assignedTo", event.target.value)}
                    placeholder="Staff name"
                  />

                  <MarketingInput
                    label="Contact Person"
                    icon={UserRound}
                    value={form.contactPerson}
                    onChange={(event) => updateForm("contactPerson", event.target.value)}
                    placeholder="Owner / manager"
                  />

                  <MarketingInput
                    label="Doctor Name"
                    icon={UserRound}
                    value={form.doctorName}
                    onChange={(event) => updateForm("doctorName", event.target.value)}
                    placeholder="Doctor to convince"
                  />

                  <MarketingInput
                    label="Mobile"
                    icon={Phone}
                    value={form.mobile}
                    onChange={(event) => updateForm("mobile", event.target.value)}
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                  />

                  <MarketingInput
                    label="Alternate Mobile"
                    icon={Phone}
                    value={form.alternateMobile}
                    onChange={(event) => updateForm("alternateMobile", event.target.value)}
                    placeholder="Optional"
                    inputMode="numeric"
                  />

                  <MarketingInput
                    label="Email"
                    value={form.email}
                    onChange={(event) => updateForm("email", event.target.value)}
                    placeholder="Optional email"
                    type="email"
                  />

                  <MarketingInput
                    label="Area"
                    icon={MapPin}
                    value={form.area}
                    onChange={(event) => updateForm("area", event.target.value)}
                    placeholder="Local area"
                  />

                  <MarketingInput
                    label="City"
                    icon={MapPin}
                    value={form.city}
                    onChange={(event) => updateForm("city", event.target.value)}
                    placeholder="City"
                  />

                  <MarketingInput
                    label="Visit Date"
                    icon={CalendarDays}
                    type="date"
                    value={form.visitDate}
                    onChange={(event) => updateForm("visitDate", event.target.value)}
                  />

                  <MarketingInput
                    label="Next Follow-up"
                    icon={CalendarDays}
                    type="date"
                    value={form.nextFollowUpDate}
                    onChange={(event) => updateForm("nextFollowUpDate", event.target.value)}
                  />

                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Pitch Status
                    </span>
                    <select
                      value={form.pitchStatus}
                      onChange={(event) => updateForm("pitchStatus", event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    >
                      {PITCH_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <MarketingInput
                    label="Expected Daily Patients"
                    icon={Target}
                    type="number"
                    min="0"
                    value={form.expectedDailyPatients}
                    onChange={(event) =>
                      updateForm("expectedDailyPatients", event.target.value)
                    }
                    placeholder="Example: 3"
                  />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Full Address
                    </span>
                    <textarea
                      rows="4"
                      value={form.address}
                      onChange={(event) => updateForm("address", event.target.value)}
                      placeholder="Shop, clinic, institute, or doctor chamber address"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Marketing Notes
                    </span>
                    <textarea
                      rows="4"
                      value={form.notes}
                      onChange={(event) => updateForm("notes", event.target.value)}
                      placeholder="What was discussed, doctor response, next action..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-3xl border border-dashed border-teal-200 bg-teal-50/60 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Visit Photos
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Upload shop board, clinic front, institute desk, or meeting photo.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                      <ImagePlus size={16} /> Choose Photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) =>
                          setPhotoFiles(Array.from(event.target.files || []).slice(0, 6))
                        }
                      />
                    </label>
                  </div>

                  {form.existingPhotos.length || photoFiles.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {form.existingPhotos.map((photo) => {
                        const markedForRemoval = form.removePhotoIds.includes(photo.id);

                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => togglePhotoRemoval(photo.id)}
                            className={`relative overflow-hidden rounded-2xl border text-left ${
                              markedForRemoval
                                ? "border-rose-300 opacity-60"
                                : "border-white"
                            }`}
                          >
                            <MarketingPhoto
                              photo={photo}
                              alt={photo.name || "Marketing visit"}
                              className="h-28 w-full object-cover"
                            />
                            <span className="absolute inset-x-2 bottom-2 rounded-xl bg-white/90 px-2 py-1 text-xs font-medium text-slate-700">
                              {markedForRemoval ? "Will remove" : "Click to remove"}
                            </span>
                          </button>
                        );
                      })}

                      {photoFiles.map((file) => (
                        <div
                          key={`${file.name}-${file.lastModified}`}
                          className="rounded-2xl border border-white bg-white px-3 py-4 text-sm shadow-sm"
                        >
                          <Camera size={18} className="mb-2 text-teal-700" />
                          <p className="truncate font-medium text-slate-800">{file.name}</p>
                          <p className="mt-1 text-xs text-slate-500">Ready to upload</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeSourceModal}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : form.id ? "Update Source" : "Save Source"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {referralSource ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
            <div className="motion-card w-full max-w-lg rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-teal-700">
                    Daily Patient Entry
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                    {referralSource.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Record patients generated from this source for a date.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReferralSource(null)}
                  className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleReferralSubmit} className="mt-5 space-y-4">
                <MarketingInput
                  label="Date"
                  icon={CalendarDays}
                  type="date"
                  value={referralForm.date}
                  onChange={(event) =>
                    setReferralForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  required
                />

                <MarketingInput
                  label="Patient Count"
                  icon={Users}
                  type="number"
                  min="0"
                  value={referralForm.patientCount}
                  onChange={(event) =>
                    setReferralForm((current) => ({
                      ...current,
                      patientCount: event.target.value,
                    }))
                  }
                  required
                />

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Patient Names
                  </span>
                  <textarea
                    rows="3"
                    value={referralForm.patientNames}
                    onChange={(event) =>
                      setReferralForm((current) => ({
                        ...current,
                        patientNames: event.target.value,
                      }))
                    }
                    placeholder="Optional, one name per line"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Notes
                  </span>
                  <textarea
                    rows="3"
                    value={referralForm.notes}
                    onChange={(event) =>
                      setReferralForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Any remarks about today's referral"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  />
                </label>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReferralSource(null)}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Daily Count"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {deleteSourceId && canEditMarketing ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
            <div className="motion-card w-full max-w-md rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-semibold text-rose-600">Delete Source</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                Remove This Marketing Source?
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This will delete its visit details, photos, and daily referral records.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteSourceId(null)}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSource}
                  className="rounded-2xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700"
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

function MegaphoneFallback() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 6.75v10.5m0-10.5 8.25-3v16.5l-8.25-3m0-10.5H5.25A2.25 2.25 0 0 0 3 9v6a2.25 2.25 0 0 0 2.25 2.25h5.25m-3 0 1.5 3"
      />
    </svg>
  );
}

function MarketingPhoto({ photo, alt, className }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let isMounted = true;
    let objectUrl = "";

    if (!photo?.url) {
      setSrc("");
      return undefined;
    }

    API.get(photo.url, { responseType: "blob" })
      .then((response) => {
        const createdUrl = URL.createObjectURL(response.data);
        if (isMounted) {
          objectUrl = createdUrl;
          setSrc(objectUrl);
        } else {
          URL.revokeObjectURL(createdUrl);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSrc("");
        }
      });

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photo?.url]);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className || ""}`}
      >
        <Camera size={16} />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
