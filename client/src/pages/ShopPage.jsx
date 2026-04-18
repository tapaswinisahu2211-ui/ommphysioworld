import {
  ArrowRight,
  BadgePercent,
  Grid2x2,
  HeartHandshake,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import API from "../services/api";
import Seo from "../components/Seo";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";
import { addToShopCart, getShopCartEventName, getShopCartItemCount } from "../utils/shopCart";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getImageUrl = (imageUrl) =>
  imageUrl ? `${API.defaults.baseURL}${imageUrl}` : "";

const getDisplayCategory = (product) => product.category || "General Wellness";

const getComparePrice = (price) => {
  const basePrice = Number(price || 0);
  return Math.max(basePrice, Math.ceil((basePrice * 1.18) / 10) * 10);
};

const getDiscountPercent = (price) => {
  const basePrice = Number(price || 0);
  const comparePrice = getComparePrice(basePrice);

  if (!comparePrice || comparePrice <= basePrice) {
    return 0;
  }

  return Math.max(1, Math.round(((comparePrice - basePrice) / comparePrice) * 100));
};

const getRating = (product, index) =>
  (4.1 + ((Number(product.stockQuantity || 0) + index) % 8) * 0.1).toFixed(1);

const getProductTag = (product, index) => {
  if (Number(product.stockQuantity || 0) <= 3) {
    return "Limited Stock";
  }

  if (index % 3 === 0) {
    return "Best Seller";
  }

  if (index % 3 === 1) {
    return "Top Rated";
  }

  return "Fast Moving";
};

const categoryAccents = [
  "from-sky-500 via-cyan-500 to-blue-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-slate-800 via-slate-700 to-slate-600",
  "from-fuchsia-500 via-pink-500 to-rose-500",
];

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cartCount, setCartCount] = useState(() => getShopCartItemCount());
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await API.get("/shop/products");
        setProducts(response.data || []);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Failed to load shop products.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const syncCartCount = () => setCartCount(getShopCartItemCount());
    const eventName = getShopCartEventName();

    window.addEventListener("storage", syncCartCount);
    window.addEventListener(eventName, syncCartCount);

    return () => {
      window.removeEventListener("storage", syncCartCount);
      window.removeEventListener(eventName, syncCartCount);
    };
  }, []);

  const categories = useMemo(() => {
    const counts = products.reduce((map, product) => {
      const category = getDisplayCategory(product);
      map.set(category, (map.get(category) || 0) + 1);
      return map;
    }, new Map());

    return [
      {
        name: "All",
        count: products.length,
        accent: "from-slate-950 via-slate-800 to-slate-700",
      },
      ...Array.from(counts.entries()).map(([name, count], index) => ({
        name,
        count,
        accent: categoryAccents[index % categoryAccents.length],
      })),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const visibleProducts = products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || getDisplayCategory(product) === activeCategory;
      const matchesKeyword =
        !keyword ||
        [product.name, product.category, product.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));

      return matchesCategory && matchesKeyword;
    });

    const sortedProducts = [...visibleProducts];

    if (sortBy === "price-low") {
      sortedProducts.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "price-high") {
      sortedProducts.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "newest") {
      sortedProducts.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } else {
      sortedProducts.sort((a, b) => {
        const scoreA =
          Number(a.stockQuantity || 0) * 2 +
          getDiscountPercent(a.price || 0) -
          Number(a.price || 0) / 100;
        const scoreB =
          Number(b.stockQuantity || 0) * 2 +
          getDiscountPercent(b.price || 0) -
          Number(b.price || 0) / 100;

        return scoreB - scoreA;
      });
    }

    return sortedProducts;
  }, [activeCategory, products, search, sortBy]);

  const featuredProduct = filteredProducts[0] || products[0] || null;
  const dealProducts = filteredProducts.slice(0, 4);
  const inStockCount = products.filter((product) => Number(product.stockQuantity || 0) > 0).length;
  const affordableCount = products.filter((product) => Number(product.price || 0) <= 999).length;
  const totalSavings = filteredProducts.reduce(
    (sum, product) => sum + (getComparePrice(product.price) - Number(product.price || 0)),
    0
  );

  const handleAddToCart = (product) => {
    addToShopCart(product, 1);
    setCartCount(getShopCartItemCount());
    setNotice(`${product.name} added to cart.`);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <PublicLayout>
      <Seo
        title="OPW Shop | Physiotherapy Wellness Products"
        description="Browse OPW shop products online, add items to cart, and complete your physiotherapy clinic purchase after patient login."
        path="/shop"
        schema={[
          createMedicalBusinessSchema({
            description:
              "OPW shop for physiotherapy-related wellness products and clinic-curated items available online.",
            path: "/shop",
            pageName: "Shop",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
          ]),
        ]}
      />
      <section className="page-section mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff,#ffffff,#eef6ff)] shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-8">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                  <Store size={16} />
                  OMM Physio World Shop
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  Clinic curated
                </span>
                <span className="inline-flex items-center gap-2">
                  <Truck size={15} className="text-sky-600" />
                  Patient-friendly buying flow
                </span>
              </div>

              <Link
                to="/shop/cart"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <ShoppingCart size={16} />
                Cart {cartCount ? `(${cartCount})` : ""}
              </Link>
            </div>

            <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_24%),linear-gradient(135deg,#066497,#0f172a,#102d55)] px-6 py-8 text-white md:px-8 md:py-10">
                <div className="max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.24em] text-white/60">
                    OPW Shop
                  </p>
                  <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                    Shop OPW products online.
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                    Browse available products, add them to cart, and complete your order after
                    patient login.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">
                      <Sparkles size={16} />
                      Online ordering
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">
                      <BadgePercent size={16} />
                      Product offers
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">
                      <HeartHandshake size={16} />
                      Clinic products
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">In Stock</p>
                      <p className="mt-2 text-3xl font-semibold">{inStockCount}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">Under 999</p>
                      <p className="mt-2 text-3xl font-semibold">{affordableCount}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/50">Visible Savings</p>
                      <p className="mt-2 text-3xl font-semibold">
                        {formatCurrency(totalSavings)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-8 md:px-8 md:py-10">
                {featuredProduct ? (
                  <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] shadow-sm">
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      {featuredProduct.imageUrl ? (
                        <img
                          src={getImageUrl(featuredProduct.imageUrl)}
                          alt={featuredProduct.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                          Product image
                        </div>
                      )}

                      <div className="absolute left-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950">
                        Featured Product
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {getDisplayCategory(featuredProduct)}
                          </p>
                          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                            {featuredProduct.name}
                          </h2>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <Star size={12} className="fill-current" />
                          {getRating(featuredProduct, 0)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-3xl font-semibold text-slate-950">
                          {formatCurrency(featuredProduct.price)}
                        </span>
                        <span className="text-sm text-slate-400 line-through">
                          {formatCurrency(getComparePrice(featuredProduct.price))}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {getDiscountPercent(featuredProduct.price)}% off
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        {featuredProduct.description ||
                          "Product details will appear here."}
                      </p>

                      <button
                        type="button"
                        disabled={featuredProduct.stockQuantity <= 0}
                        onClick={() => handleAddToCart(featuredProduct)}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <ShoppingCart size={17} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                    Products will appear here once added by admin.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {categories.map((category, index) => (
              <button
                key={category.name}
                type="button"
                onClick={() => setActiveCategory(category.name)}
                className={`overflow-hidden rounded-[24px] border text-left shadow-sm transition hover:-translate-y-1 ${
                  activeCategory === category.name
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                <div
                  className={`h-2 bg-gradient-to-r ${category.accent || categoryAccents[index % categoryAccents.length]}`}
                />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-current/55">Category</p>
                  <h3 className="mt-2 text-lg font-semibold">{category.name}</h3>
                  <p className="mt-1 text-sm text-current/70">
                    {category.count} item{category.count === 1 ? "" : "s"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-28">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                    <Grid2x2 size={18} />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Browse</p>
                    <h2 className="text-xl font-semibold text-slate-950">Find Products Faster</h2>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="relative">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search products"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="featured">Featured first</option>
                    <option value="price-low">Price low to high</option>
                    <option value="price-high">Price high to low</option>
                    <option value="newest">Newest first</option>
                  </select>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Selected Category</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{activeCategory}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visible Results</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {filteredProducts.length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cart Count</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{cartCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {dealProducts.length ? (
                <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                        Featured Products
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                        Quick product view
                      </h2>
                    </div>
                    <Link
                      to="/shop/cart"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cart
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {dealProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                            {getProductTag(product, index)}
                          </span>
                          <span className="text-sm font-semibold text-emerald-600">
                            {getDiscountPercent(product.price)}% off
                          </span>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-950">{product.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{getDisplayCategory(product)}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-xl font-semibold text-slate-950">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="text-sm text-slate-400 line-through">
                            {formatCurrency(getComparePrice(product.price))}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={product.stockQuantity <= 0}
                          onClick={() => handleAddToCart(product)}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">All Products</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {activeCategory === "All" ? "All Products" : `${activeCategory} Products`}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500">
                    {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
                  </p>
                </div>

                {error ? (
                  <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                {!loading && filteredProducts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-slate-500">
                    No matching products available right now.
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="group overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f9fbff)] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                          {product.imageUrl ? (
                            <img
                              src={getImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-400">
                              Product image
                            </div>
                          )}

                          <div className="absolute left-4 top-4 flex items-center gap-2">
                            <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-900">
                              {getProductTag(product, index)}
                            </span>
                          </div>

                          <div className="absolute bottom-4 right-4 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-semibold text-white">
                            {product.stockQuantity > 0 ? `${product.stockQuantity} left` : "Sold out"}
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                {getDisplayCategory(product)}
                              </p>
                              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                                {product.name}
                              </h3>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <Star size={12} className="fill-current" />
                              {getRating(product, index)}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center gap-3">
                            <span className="text-2xl font-semibold text-slate-950">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-sm text-slate-400 line-through">
                              {formatCurrency(getComparePrice(product.price))}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {getDiscountPercent(product.price)}% off
                            </span>
                          </div>

                          <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-500">
                            {product.description ||
                              "Product details will be updated soon."}
                          </p>

                          <button
                            type="button"
                            disabled={product.stockQuantity <= 0}
                            onClick={() => handleAddToCart(product)}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <ShoppingCart size={17} />
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {notice ? (
            <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700 shadow-lg">
              {notice}
            </div>
          ) : null}
        </div>
      </section>
    </PublicLayout>
  );
}
