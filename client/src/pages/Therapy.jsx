import { useEffect, useMemo, useState } from "react";
import {
  CircleX,
  Download,
  Eye,
  FileText,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";
import { canAddModule, canEditModule, getStoredUser } from "../utils/auth";
import { cleanText } from "../utils/validation";

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-msvideo";

const formatFileSize = (value) => {
  const size = Number(value || 0);

  if (!size) {
    return "0 KB";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(parsed);
};

const typeMeta = {
  image: {
    label: "Image",
    icon: ImageIcon,
    tone: "bg-sky-50 text-sky-700",
  },
  gif: {
    label: "GIF",
    icon: ImageIcon,
    tone: "bg-fuchsia-50 text-fuchsia-700",
  },
  video: {
    label: "Video",
    icon: Film,
    tone: "bg-amber-50 text-amber-700",
  },
  document: {
    label: "Document",
    icon: FileText,
    tone: "bg-emerald-50 text-emerald-700",
  },
};

export default function Therapy() {
  const currentUser = getStoredUser();
  const canAddTherapy = canAddModule("therapy", currentUser);
  const canEditTherapy = canEditModule("therapy", currentUser);
  const [services, setServices] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [activeFileAction, setActiveFileAction] = useState("");
  const [previewResource, setPreviewResource] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteResource, setDeleteResource] = useState(null);
  const [form, setForm] = useState({
    id: null,
    serviceId: "",
    title: "",
    description: "",
    file: null,
    existingFileName: "",
  });

  const loadTherapyData = async () => {
    try {
      const [servicesResponse, resourcesResponse] = await Promise.all([
        API.get("/services"),
        API.get("/therapy-resources"),
      ]);

      setServices(servicesResponse.data || []);
      setResources(resourcesResponse.data || []);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load therapy data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTherapyData();
  }, []);

  const resetForm = () => {
    setForm({
      id: null,
      serviceId: services[0]?.id || "",
      title: "",
      description: "",
      file: null,
      existingFileName: "",
    });
  };

  const openAddModal = () => {
    setModalError("");
    setForm({
      id: null,
      serviceId: services[0]?.id || "",
      title: "",
      description: "",
      file: null,
      existingFileName: "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError("");
    resetForm();
  };

  const handleEdit = (resource) => {
    setModalError("");
    setForm({
      id: resource.id,
      serviceId: resource.serviceId,
      title: resource.title,
      description: resource.description || "",
      file: null,
      existingFileName: resource.fileName,
    });
    setShowModal(true);
  };

  const filteredResources = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesService =
        serviceFilter === "all" || resource.serviceId === serviceFilter;

      if (!matchesService) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        resource.title.toLowerCase().includes(keyword) ||
        resource.fileName.toLowerCase().includes(keyword) ||
        resource.serviceName.toLowerCase().includes(keyword) ||
        String(resource.description || "").toLowerCase().includes(keyword)
      );
    });
  }, [resources, search, serviceFilter]);

  const servicesUsed = useMemo(
    () => new Set(resources.map((resource) => resource.serviceId).filter(Boolean)).size,
    [resources]
  );

  const statCards = [
    {
      label: "Therapy Files",
      value: resources.length,
      icon: FolderOpen,
      tone: "bg-cyan-50 text-cyan-700",
    },
    {
      label: "Services Covered",
      value: servicesUsed,
      icon: Layers3,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Visible Results",
      value: filteredResources.length,
      icon: Search,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setModalError("");

    const payload = new FormData();
    const title = cleanText(form.title);
    const description = cleanText(form.description);

    if (!form.serviceId) {
      setModalError("Please choose a service.");
      setSaving(false);
      return;
    }

    if (!title) {
      setModalError("Title is required.");
      setSaving(false);
      return;
    }

    if (!form.id && !form.file) {
      setModalError("Please choose a file to upload.");
      setSaving(false);
      return;
    }

    payload.append("serviceId", form.serviceId);
    payload.append("title", title);
    payload.append("description", description);

    if (form.file) {
      payload.append("file", form.file);
    }

    try {
      if (form.id) {
        const response = await API.put(`/therapy-resources/${form.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setResources((current) =>
          current.map((resource) =>
            resource.id === form.id ? response.data : resource
          )
        );
      } else {
        const response = await API.post("/therapy-resources", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setResources((current) => [response.data, ...current]);
      }

      closeModal();
      setError("");
    } catch (saveError) {
      setModalError(
        saveError.response?.data?.message || "Failed to save therapy resource."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteResource) {
      return;
    }

    try {
      await API.delete(`/therapy-resources/${deleteResource.id}`);
      setResources((current) =>
        current.filter((resource) => resource.id !== deleteResource.id)
      );
      setDeleteResource(null);
      setError("");
    } catch (deleteError) {
      setError(
        deleteError.response?.data?.message || "Failed to delete therapy resource."
      );
    }
  };

  const handleFileAction = async (resource, action) => {
    const actionKey = `${action}:${resource.id}`;

    try {
      setActiveFileAction(actionKey);
      setError("");

      const response = await API.get(
        action === "view" ? resource.fileUrl : resource.downloadUrl,
        {
          responseType: "blob",
        }
      );

      const objectUrl = window.URL.createObjectURL(response.data);

      if (action === "view") {
        setPreviewResource({
          ...resource,
          objectUrl,
        });
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = resource.fileName || "therapy-file";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.setTimeout(() => {
          window.URL.revokeObjectURL(objectUrl);
        }, 60000);
      }
    } catch (actionError) {
      setError(
        actionError.response?.data?.message ||
          `Failed to ${action === "view" ? "open" : "download"} therapy file.`
      );
    } finally {
      setActiveFileAction("");
    }
  };

  const closePreview = () => {
    if (previewResource?.objectUrl) {
      window.URL.revokeObjectURL(previewResource.objectUrl);
    }

    setPreviewResource(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="motion-panel overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.24),_transparent_28%),linear-gradient(135deg,#0f172a,#111827,#1d4ed8)] px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Therapy Library
              </p>
              <div>
                <h1 className="text-2xl font-semibold">Therapy</h1>
                <p className="mt-1 max-w-2xl text-sm text-white/75">
                  Upload videos, documents, images, and GIFs service-wise so the
                  admin team can manage therapy material from one place.
                </p>
              </div>
            </div>

            {canAddTherapy ? (
              <button
                onClick={openAddModal}
                disabled={!services.length}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} /> Add Therapy File
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

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
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Therapy Resource Manager
              </h2>
              <p className="text-sm text-slate-500">
                Filter therapy files by service and keep uploads under 12 MB each.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_220px] xl:min-w-[580px]">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by title, file name, or service"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <select
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              >
                <option value="all">All Services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!services.length && !loading ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                <FolderOpen size={26} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                Add a service first
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Therapy files are linked to services, so please create at least one
                service before uploading here.
              </p>
              <Link
                to="/services"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                Go to Services
              </Link>
            </div>
          ) : !loading && filteredResources.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                <Upload size={26} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                {resources.length ? "No matching therapy files" : "No therapy files added yet"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {resources.length
                  ? "Try another search or service filter to see more therapy files."
                  : "Start uploading videos, images, GIFs, and documents for each service."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="bg-slate-50 text-sm text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">No.</th>
                      <th className="px-5 py-4 font-medium">Service</th>
                      <th className="px-5 py-4 font-medium">Title</th>
                      <th className="px-5 py-4 font-medium">File</th>
                      <th className="px-5 py-4 font-medium">Type</th>
                      <th className="px-5 py-4 font-medium">Size</th>
                      <th className="px-5 py-4 font-medium">Updated</th>
                      <th className="px-5 py-4 font-medium text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredResources.map((resource, index) => {
                      const meta = typeMeta[resource.resourceType] || typeMeta.document;
                      const MetaIcon = meta.icon;

                      return (
                        <tr key={resource.id} className="bg-white transition hover:bg-slate-50">
                          <td className="px-5 py-4 font-medium text-slate-600">
                            {index + 1}
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {resource.serviceName || "Unknown Service"}
                              </p>
                              <p className="text-sm text-slate-500">
                                ID #{resource.serviceId?.slice(-6) || "N/A"}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-medium text-slate-900">{resource.title}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                {resource.description || "No description added yet."}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            <p className="font-medium text-slate-900">{resource.fileName}</p>
                            <p className="text-sm text-slate-500">{resource.mimeType}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${meta.tone}`}
                            >
                              <MetaIcon size={14} />
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {formatFileSize(resource.sizeBytes)}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(resource.updatedAt)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={`${API.defaults.baseURL}${resource.fileUrl}`}
                                onClick={(event) => {
                                  event.preventDefault();
                                  handleFileAction(resource, "view");
                                }}
                                className="rounded-xl border border-sky-200 bg-sky-50 p-2 text-sky-700 transition hover:bg-sky-100"
                                title="View file"
                              >
                                <Eye size={16} />
                              </a>

                              <a
                                href={`${API.defaults.baseURL}${resource.downloadUrl}`}
                                onClick={(event) => {
                                  event.preventDefault();
                                  handleFileAction(resource, "download");
                                }}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100"
                                title="Download file"
                              >
                                <Download size={16} />
                              </a>

                              {canEditTherapy ? (
                                <button
                                  type="button"
                                  onClick={() => handleEdit(resource)}
                                  className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100"
                                  title="Edit file"
                                >
                                  <Pencil size={16} />
                                </button>
                              ) : null}

                              {canEditTherapy ? (
                                <button
                                  type="button"
                                  onClick={() => setDeleteResource(resource)}
                                  className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100"
                                  title="Delete file"
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : null}

                              {activeFileAction === `view:${resource.id}` ||
                              activeFileAction === `download:${resource.id}` ? (
                                <span className="text-xs font-medium text-slate-500">
                                  Working...
                                </span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {showModal && (canAddTherapy || canEditTherapy) ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="motion-card w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-5">
                <p className="text-sm font-medium text-sky-600">Therapy File</p>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {form.id ? "Edit Therapy File" : "Add Therapy File"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Upload one file at a time and connect it to the correct service.
                </p>
              </div>

              {modalError ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {modalError}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Service
                    </label>
                    <select
                      value={form.serviceId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          serviceId: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      required
                    >
                      <option value="">Select service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Title
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Example: Shoulder mobility exercise"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Short admin note about this therapy resource"
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Upload File
                  </label>
                  <input
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        file: event.target.files?.[0] || null,
                      }))
                    }
                    className="block w-full text-sm text-slate-600"
                  />

                  <div className="mt-3 space-y-1 text-sm text-slate-500">
                    <p>Allowed: video, PDF, Word, image, GIF</p>
                    <p>Size limit: 12 MB per file</p>
                    {form.file ? <p>Selected: {form.file.name}</p> : null}
                    {!form.file && form.existingFileName ? (
                      <p>Current file: {form.existingFileName}</p>
                    ) : null}
                  </div>
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
                    {saving ? "Saving..." : form.id ? "Update File" : "Upload File"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {deleteResource ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="motion-card w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-medium text-rose-600">Delete Therapy File</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                Remove This File?
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                This will permanently remove{" "}
                <span className="font-medium text-slate-700">
                  {deleteResource.title}
                </span>{" "}
                from the therapy library.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteResource(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-medium text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {previewResource ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sky-600">Therapy Preview</p>
                  <h3 className="truncate text-xl font-semibold text-slate-900">
                    {previewResource.title}
                  </h3>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {previewResource.fileName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePreview}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                  title="Close preview"
                >
                  <CircleX size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
                {(previewResource.resourceType === "image" ||
                  previewResource.resourceType === "gif") ? (
                  <div className="flex min-h-[60vh] items-center justify-center">
                    <img
                      src={previewResource.objectUrl}
                      alt={previewResource.title}
                      className="max-h-[75vh] max-w-full rounded-2xl bg-white object-contain shadow-sm"
                    />
                  </div>
                ) : null}

                {previewResource.resourceType === "video" ? (
                  <div className="flex min-h-[60vh] items-center justify-center">
                    <video
                      src={previewResource.objectUrl}
                      controls
                      className="max-h-[75vh] w-full rounded-2xl bg-black shadow-sm"
                    />
                  </div>
                ) : null}

                {previewResource.mimeType === "application/pdf" ? (
                  <iframe
                    src={previewResource.objectUrl}
                    title={previewResource.title}
                    className="h-[75vh] w-full rounded-2xl border border-slate-200 bg-white"
                  />
                ) : null}

                {!(
                  previewResource.resourceType === "image" ||
                  previewResource.resourceType === "gif" ||
                  previewResource.resourceType === "video" ||
                  previewResource.mimeType === "application/pdf"
                ) ? (
                  <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
                    <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">
                      <FileText size={32} />
                    </div>
                    <h4 className="mt-5 text-xl font-semibold text-slate-900">
                      Preview not available for this file type
                    </h4>
                    <p className="mt-2 max-w-md text-sm text-slate-500">
                      This file can be downloaded, but the browser cannot display it
                      directly inside the preview panel.
                    </p>
                    <a
                      href={`${API.defaults.baseURL}${previewResource.downloadUrl}`}
                      onClick={(event) => {
                        event.preventDefault();
                        handleFileAction(previewResource, "download");
                      }}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      <Download size={16} />
                      Download File
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
