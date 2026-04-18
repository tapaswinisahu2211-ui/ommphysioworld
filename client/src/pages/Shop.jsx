import { useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  Boxes,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";
import { canAddModule, canEditModule, getStoredUser } from "../utils/auth";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getImageUrl = (imageUrl) =>
  imageUrl ? `${API.defaults.baseURL}${imageUrl}` : "";

const emptyForm = {
  id: "",
  name: "",
  category: "",
  description: "",
  price: "",
  stockQuantity: "",
  isActive: true,
  imageUrl: "",
};

export default function Shop() {
  const currentUser = getStoredUser();
  const canAddShop = canAddModule("shop", currentUser);
  const canEditShop = canEditModule("shop", currentUser);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadShopData = async () => {
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        API.get("/admin/shop/products"),
        API.get("/admin/shop/orders"),
      ]);

      setProducts(productsResponse.data || []);
      setOrders(ordersResponse.data || []);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load shop data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.category, product.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [products, search]);

  const stats = [
    {
      label: "Products",
      value: products.length,
      icon: Package,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Active Products",
      value: products.filter((product) => product.isActive).length,
      icon: Boxes,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Orders",
      value: orders.length,
      icon: ShoppingBag,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Revenue",
      value: formatCurrency(
        orders
          .filter((order) => order.status !== "cancelled")
          .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
      ),
      icon: BadgeIndianRupee,
      tone: "bg-fuchsia-50 text-fuchsia-700",
    },
  ];

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setRemoveImage(false);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name || "",
      category: product.category || "",
      description: product.description || "",
      price: String(product.price || ""),
      stockQuantity: String(product.stockQuantity || 0),
      isActive: Boolean(product.isActive),
      imageUrl: product.imageUrl || "",
    });
    setImageFile(null);
    setRemoveImage(false);
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (form.name.trim().length < 2) {
      setError("Product name must be at least 2 characters.");
      setSaving(false);
      return;
    }

    if (Number(form.price || 0) <= 0) {
      setError("Product price must be greater than zero.");
      setSaving(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("category", form.category.trim());
      payload.append("description", form.description.trim());
      payload.append("price", String(form.price || 0));
      payload.append("stockQuantity", String(form.stockQuantity || 0));
      payload.append("isActive", String(Boolean(form.isActive)));

      if (imageFile) {
        payload.append("image", imageFile);
      }

      if (removeImage) {
        payload.append("removeImage", "true");
      }

      if (form.id) {
        const response = await API.put(`/admin/shop/products/${form.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setProducts((current) =>
          current.map((product) => (product.id === form.id ? response.data : product))
        );
      } else {
        const response = await API.post("/admin/shop/products", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setProducts((current) => [response.data, ...current]);
      }

      closeModal();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save shop product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/admin/shop/products/${deleteId}`);
      setProducts((current) => current.filter((product) => product.id !== deleteId));
      setDeleteId("");
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete shop product.");
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      const response = await API.patch(`/admin/shop/orders/${orderId}/status`, {
        status,
      });

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? response.data : order))
      );
      await loadShopData();
    } catch (statusError) {
      setError(statusError.response?.data?.message || "Failed to update shop order status.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="motion-panel overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,#0f172a,#111827,#122c4a)] px-5 py-5 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Shop Management</p>
              <div>
                <h1 className="text-2xl font-semibold">Shop</h1>
                <p className="mt-1 max-w-2xl text-sm text-white/75">
                  Add products, manage stock, and review orders from the website.
                </p>
              </div>
            </div>

            {canAddShop ? (
              <button
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                <Plus size={16} /> Add Product
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="stagger-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="motion-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Product Catalog</h2>
              <p className="text-sm text-slate-500">
                Add products for sale, update stock, and decide what stays visible on the website.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search products"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          {!loading && filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-slate-500">
              No shop products found yet.
            </div>
          ) : (
            <div className="stagger-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="motion-card rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-sm"
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                    {product.imageUrl ? (
                      <img
                        src={getImageUrl(product.imageUrl)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImagePlus size={28} />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {product.category || "General"}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{product.name}</h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        product.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {product.isActive ? "Live" : "Hidden"}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                    {product.description || "No product description added yet."}
                  </p>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Price</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stock</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {product.stockQuantity}
                      </p>
                    </div>
                  </div>

                  {canEditShop ? (
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:bg-emerald-100"
                        title="Edit product"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(product.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100"
                        title="Delete product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="motion-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Recent Orders</h2>
            <p className="text-sm text-slate-500">
              Track incoming purchases and update their progress as the team handles them.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              No shop orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Order</th>
                    <th className="px-3 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Items</th>
                    <th className="px-3 py-3 font-medium">Amount</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-4">
                        <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleString("en-IN")}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        <p className="font-medium text-slate-900">{order.customerName}</p>
                        <p>{order.customerEmail}</p>
                        <p>{order.customerMobile}</p>
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {(order.items || []).map((item) => (
                          <p key={item.id}>
                            {item.productName} x {item.quantity}
                          </p>
                        ))}
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-3 py-4">
                        <select
                          value={order.status}
                          onChange={(event) => handleStatusChange(order.id, event.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="motion-card w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-5">
                <p className="text-sm font-medium text-emerald-600">Product Form</p>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {form.id ? "Edit Product" : "Add Product"}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Category
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, category: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      placeholder="Example: Support Belt"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, price: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.stockQuantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          stockQuantity: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    placeholder="Add a short product description for buyers."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Product Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      {imageFile
                        ? imageFile.name
                        : form.imageUrl
                        ? "Current product image will stay unless removed."
                        : "PNG, JPG, WEBP, or GIF up to 8 MB."}
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={removeImage}
                      onChange={(event) => setRemoveImage(event.target.checked)}
                    />
                    Remove image
                  </label>
                </div>

                <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, isActive: event.target.checked }))
                    }
                  />
                  Show this product on the public website
                </label>

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
                    {saving ? "Saving..." : form.id ? "Update Product" : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {deleteId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="motion-card w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-medium text-rose-600">Delete Product</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">Remove this product?</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This removes the product from the catalog. Existing orders will keep their own saved
                item snapshots.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId("")}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
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
