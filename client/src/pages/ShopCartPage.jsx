import {
  BadgePercent,
  LockKeyhole,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import API from "../services/api";
import Seo from "../components/Seo";
import { getPatientUser } from "../utils/patientAuth";
import {
  clearShopCart,
  getShopCart,
  getShopCartEventName,
  removeFromShopCart,
  updateShopCartQuantity,
} from "../utils/shopCart";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getImageUrl = (imageUrl) =>
  imageUrl ? `${API.defaults.baseURL}${imageUrl}` : "";

export default function ShopCartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => getShopCart());
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const patientUser = getPatientUser();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await API.get("/shop/products");
        setProducts(response.data || []);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Failed to load cart products.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const syncCart = () => setCartItems(getShopCart());
    const eventName = getShopCartEventName();

    window.addEventListener("storage", syncCart);
    window.addEventListener(eventName, syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(eventName, syncCart);
    };
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      if (!patientUser?.token) {
        setOrders([]);
        return;
      }

      try {
        const response = await API.get("/shop/orders/my");
        setOrders(response.data || []);
      } catch (_) {
        setOrders([]);
      }
    };

    loadOrders();
  }, [patientUser?.token]);

  const detailedItems = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product]));

    return cartItems.map((item) => {
      const liveProduct = productMap.get(item.productId);
      const quantity = Math.max(1, Number(item.quantity || 1));

      return {
        ...item,
        quantity,
        product: liveProduct || null,
        name: liveProduct?.name || item.name || "Unavailable product",
        imageUrl: liveProduct?.imageUrl || item.imageUrl || "",
        price: Number(liveProduct?.price ?? item.price ?? 0),
        stockQuantity: Number(liveProduct?.stockQuantity || 0),
        unavailable: !liveProduct,
      };
    });
  }, [cartItems, products]);

  const validItems = detailedItems.filter(
    (item) =>
      item.product &&
      item.stockQuantity > 0 &&
      item.quantity > 0 &&
      item.quantity <= item.stockQuantity
  );

  const invalidItems = detailedItems.filter((item) => !validItems.includes(item));
  const totalQuantity = validItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const subtotalAmount = validItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const careDiscount = validItems.length >= 3 ? subtotalAmount * 0.05 : 0;
  const payableAmount = Math.max(0, subtotalAmount - careDiscount);

  const updateQuantity = (productId, quantity) => {
    updateShopCartQuantity(productId, quantity);
    setCartItems(getShopCart());
  };

  const handleRemove = (productId) => {
    removeFromShopCart(productId);
    setCartItems(getShopCart());
  };

  const handleCheckout = async () => {
    if (!validItems.length) {
      setError("Add at least one available product to continue.");
      return;
    }

    if (!patientUser?.token) {
      navigate(`/patient-login?redirect=${encodeURIComponent("/shop/cart")}`);
      return;
    }

    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      await API.post("/shop/orders", {
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        note,
      });

      clearShopCart();
      setCartItems([]);
      setNote("");
      setNotice("Order placed successfully. OPW will process it from the shop desk.");

      const ordersResponse = await API.get("/shop/orders/my");
      setOrders(ordersResponse.data || []);
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Failed to place your order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <Seo
        title="Shop Cart"
        description="Review selected OPW shop products, login as a patient, and place your order."
        path="/shop/cart"
        robots="noindex, nofollow"
      />
      <section className="page-section mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="motion-panel overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(125,211,252,0.18),_transparent_28%),linear-gradient(135deg,#06131f,#0f2745,#125f6e)] p-8 text-white shadow-[0_34px_100px_rgba(15,23,42,0.18)] md:p-10">
              <p className="text-sm uppercase tracking-[0.25em] text-white/60">Cart Checkout</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Review your cart and place your order.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Check selected products, update quantity, and continue after patient login.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/50">Items</p>
                  <p className="mt-2 text-2xl font-semibold">{detailedItems.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/50">Ready To Buy</p>
                  <p className="mt-2 text-2xl font-semibold">{validItems.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/50">Payable</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(payableAmount)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="motion-card rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Checkout Flow</p>
                <div className="mt-5 space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">Add products to cart</p>
                      <p className="text-sm text-slate-500">You can do this without login</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">Login as patient</p>
                      <p className="text-sm text-slate-500">Required before placing the order</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">Place order</p>
                      <p className="text-sm text-slate-500">OPW team will review and process it</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="motion-card rounded-[34px] border border-slate-200 bg-[linear-gradient(145deg,#fffdf6,#ffffff,#f3f8ff)] p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Order Info</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
                    <ShieldCheck size={18} />
                    Patient login is required before order creation
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-sky-50 px-4 py-3 text-sky-700">
                    <Truck size={18} />
                    Order is managed by OPW
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-amber-700">
                    <PackageCheck size={18} />
                    Stock is checked before order placement
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}

          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-5">
              {!loading && detailedItems.length === 0 ? (
                <div className="motion-card rounded-[32px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                    <ShoppingCart size={28} />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold text-slate-950">Your cart is empty</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Add some products from the shop to continue.
                  </p>
                  <Link
                    to="/shop"
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <ShoppingBag size={17} />
                    Browse Shop
                  </Link>
                </div>
              ) : (
                <>
                  {detailedItems.map((item) => (
                    <div
                      key={item.productId}
                      className="motion-card overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="grid gap-0 md:grid-cols-[180px_1fr]">
                        <div className="h-full min-h-[180px] bg-slate-100">
                          {item.imageUrl ? (
                            <img
                              src={getImageUrl(item.imageUrl)}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="p-5 md:p-6">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                                    item.unavailable
                                      ? "bg-rose-50 text-rose-700"
                                      : item.quantity > item.stockQuantity
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {item.unavailable
                                    ? "Unavailable"
                                    : item.quantity > item.stockQuantity
                                    ? "Qty exceeds stock"
                                    : "Ready"}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                  Stock {item.stockQuantity}
                                </span>
                              </div>

                              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{item.name}</h2>
                              <p className="mt-2 text-sm text-slate-500">
                                {item.unavailable
                                  ? "This product is no longer available in the live catalog."
                                  : `${item.stockQuantity} item(s) currently available for checkout.`}
                              </p>
                            </div>

                            <div className="text-left lg:text-right">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Unit Price</p>
                              <p className="mt-1 text-2xl font-semibold text-slate-950">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.productId, Math.max(1, item.quantity - 1))
                                }
                                className="rounded-full p-2 text-slate-600 hover:bg-white"
                                disabled={item.unavailable}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="min-w-[36px] text-center text-sm font-medium text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.product
                                      ? Math.min(item.stockQuantity, item.quantity + 1)
                                      : item.quantity
                                  )
                                }
                                className="rounded-full p-2 text-slate-600 hover:bg-white"
                                disabled={item.unavailable || item.quantity >= item.stockQuantity}
                              >
                                <Plus size={16} />
                              </button>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                  Line Total
                                </p>
                                <p className="mt-1 text-lg font-semibold text-slate-950">
                                  {formatCurrency(item.price * item.quantity)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemove(item.productId)}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-100"
                              >
                                <Trash2 size={16} />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="space-y-6">
              <div className="motion-card rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-28">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Summary</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">Order Summary</h2>
                  </div>
                  <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    {totalQuantity} item(s)
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Available products</span>
                    <span>{validItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Unavailable products</span>
                    <span>{invalidItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700">
                    <span className="inline-flex items-center gap-2">
                      <BadgePercent size={16} />
                      Discount
                    </span>
                    <span>- {formatCurrency(careDiscount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-950">
                    <span>Payable amount</span>
                    <span>{formatCurrency(payableAmount)}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  {patientUser?.token ? (
                    <span>Logged in as {patientUser.name || patientUser.email}.</span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      <LockKeyhole size={16} />
                      Login is required before purchase.
                    </span>
                  )}
                </div>

                {!patientUser?.token ? (
                  <Link
                    to={`/patient-login?redirect=${encodeURIComponent("/shop/cart")}`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <LockKeyhole size={17} />
                    Login First
                  </Link>
                ) : null}

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Order Note</span>
                  <textarea
                    rows={4}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Any preference or order note for OPW"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                <button
                  type="button"
                  disabled={submitting || !validItems.length}
                  onClick={handleCheckout}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <ShoppingBag size={18} />
                  {patientUser?.token ? "Place Order" : "Login to Buy"}
                </button>
              </div>

              {patientUser?.token ? (
                <div className="motion-card rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                        Recent Orders
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-950">My Recent Orders</h2>
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No orders placed yet.</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {orders.slice(0, 5).map((order, index) => (
                        <div
                          key={order.id}
                          className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-4 py-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(order.createdAt).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                                order.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : order.status === "cancelled"
                                  ? "bg-rose-50 text-rose-700"
                                  : order.status === "confirmed"
                                  ? "bg-sky-50 text-sky-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                            <span>{order.items.length} product line(s)</span>
                            <span className="font-semibold text-slate-950">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-slate-500">
                            {(order.items || [])
                              .slice(0, 3)
                              .map((item) => `${item.productName} x ${item.quantity}`)
                              .join(", ")}
                            {order.items.length > 3 ? ` +${order.items.length - 3} more` : ""}
                          </p>

                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                order.status === "completed"
                                  ? "w-full bg-emerald-500"
                                  : order.status === "confirmed"
                                  ? "w-2/3 bg-sky-500"
                                  : order.status === "cancelled"
                                  ? "w-full bg-rose-400"
                                  : index % 2 === 0
                                  ? "w-1/3 bg-amber-400"
                                  : "w-1/4 bg-amber-400"
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
