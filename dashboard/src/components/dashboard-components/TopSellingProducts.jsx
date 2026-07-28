import React from "react";
import { useSelector } from "react-redux";
import {
  Star,
  BarChart3,
  Trophy,
  Package2,
  TrendingUp,
  ShieldCheck,
  Activity,
  Eye,
  ShoppingBag,
  Boxes,
  Sparkles,
} from "lucide-react";

const TopSellingProducts = () => {
  const { allProducts: products } = useSelector((state) => state.product || {});
  const { topSellingProducts: adminTops } = useSelector(
    (state) => state.admin || {}
  );

  // 🚀 ULTRA PRO ANALYTICS ENGINE
  const processedList = React.useMemo(() => {
    const sourceData =
      adminTops && Array.isArray(adminTops) && adminTops.length > 0
        ? adminTops
        : products;

    if (!sourceData || !Array.isArray(sourceData)) return [];

    return [...sourceData]
      .map((product) => {
        const sold = Number(product?.total_sold || product?.sold) || 0;
        const stock = Number(product?.stock) || 0;
        const rating = Number(product?.rating) || 4.5;
        const reviews = Number(product?.numOfReviews) || 0;
        const price = Number(product?.price) || 0;
        const revenue = sold * price;

        // 🔥 CATEGORY FORMATTER
        let rawCategory = product?.category || "General";

        if (Array.isArray(rawCategory)) {
          rawCategory = rawCategory[0];
        }

        const category =
          rawCategory?.charAt(0)?.toUpperCase() +
          rawCategory?.slice(1)?.toLowerCase();

        // 🔥 ULTRA SMART IMAGE PARSER
        let thumbnail = "";

        try {
          // CASE 0 => image direct string (returned by backend topSellingProducts query)
          if (
            product?.image &&
            typeof product.image === "string"
          ) {
            thumbnail = product.image;
          }

          // CASE 1 => thumbnail direct string
          else if (
            product?.thumbnail &&
            typeof product.thumbnail === "string"
          ) {
            thumbnail = product.thumbnail;
          }

          // CASE 2 => thumbnail object
          else if (
            product?.thumbnail &&
            typeof product.thumbnail === "object"
          ) {
            thumbnail =
              product.thumbnail?.url ||
              product.thumbnail?.secure_url ||
              "";
          }

          // CASE 3 => images stringified array
          else if (
            product?.images &&
            typeof product.images === "string"
          ) {
            const parsedImages = JSON.parse(product.images);

            if (
              Array.isArray(parsedImages) &&
              parsedImages.length > 0
            ) {
              const firstImage = parsedImages[0];

              if (typeof firstImage === "string") {
                thumbnail = firstImage;
              } else {
                thumbnail =
                  firstImage?.url ||
                  firstImage?.secure_url ||
                  "";
              }
            }
          }

          // CASE 4 => images array
          else if (Array.isArray(product?.images)) {
            const firstImage = product.images[0];

            if (typeof firstImage === "string") {
              thumbnail = firstImage;
            } else {
              thumbnail =
                firstImage?.url ||
                firstImage?.secure_url ||
                "";
            }
          }
        } catch (error) {
          console.log("Image Parse Error:", error);
        }

        // 🔥 FINAL FALLBACK
        if (!thumbnail || thumbnail === "undefined") {
          thumbnail =
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500";
        }

        return {
          ...product,
          sold,
          stock,
          rating,
          reviews,
          price,
          revenue,
          category,
          thumbnail,
        };
      })
      .sort((a, b) => {
        if (b.sold !== a.sold) return b.sold - a.sold;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.revenue - a.revenue;
      })
      .slice(0, 6);
  }, [products, adminTops]);

  // 🚀 PERFORMANCE LABEL ENGINE
  const getPerformanceLevel = (sold) => {
    if (sold >= 250) {
      return {
        label: "Elite",
        color:
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    }

    if (sold >= 120) {
      return {
        label: "Hot",
        color:
          "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      };
    }

    return {
      label: "Growing",
      color:
        "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
  };

  return (
    <div className="w-full overflow-hidden rounded-[2rem] border border-slate-800/60 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#111827] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">

      {/* 🌌 TOP HEADER */}
      <div className="relative overflow-hidden px-6 py-5 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-xl">

        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-5">

          {/* LEFT */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase tracking-widest font-black flex items-center gap-1">
                <Sparkles size={11} />
                AI Commerce Engine
              </div>

              <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest font-black flex items-center gap-1">
                <ShieldCheck size={11} />
                Live Synced
              </div>
            </div>

            <h2 className="text-white font-black tracking-tight text-2xl flex items-center gap-2">
              <TrendingUp size={22} className="text-indigo-400" />
              Top Selling Products
            </h2>

            <p className="text-slate-500 text-xs mt-2 font-semibold max-w-[600px]">
              Advanced product ranking system powered by live inventory,
              revenue conversion metrics and performance analytics.
            </p>
          </div>

          {/* RIGHT STATS */}
          <div className="flex items-center flex-wrap gap-3">

            <div className="px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                Products
              </p>

              <h4 className="text-white text-lg font-black mt-1">
                {processedList.length}
              </h4>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                Status
              </p>

              <h4 className="text-emerald-400 text-lg font-black mt-1 flex items-center gap-1">
                <Activity size={14} className="animate-pulse" />
                Active
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* 🧠 PRODUCT TABLE */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[1150px] border-collapse">

          {/* TABLE HEAD */}
          <thead className="bg-slate-950/70">
            <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800/60">

              <th className="px-6 py-5 text-center font-black">
                Rank
              </th>

              <th className="px-6 py-5 text-left font-black">
                Product
              </th>

              <th className="px-6 py-5 text-left font-black">
                Category
              </th>

              <th className="px-6 py-5 text-left font-black">
                Sold
              </th>

              <th className="px-6 py-5 text-left font-black">
                Revenue
              </th>

              <th className="px-6 py-5 text-left font-black">
                Price
              </th>

              <th className="px-6 py-5 text-left font-black">
                Rating
              </th>

              <th className="px-6 py-5 text-left font-black">
                Stock
              </th>

              <th className="px-6 py-5 text-left font-black">
                Performance
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-slate-800/50">
            {processedList.length > 0 ? (
              processedList.map((product, index) => {
                const performance = getPerformanceLevel(product.sold);

                return (
                  <tr
                    key={product?._id || index}
                    className="group hover:bg-slate-800/30 transition-all duration-300"
                  >

                    {/* 🏆 RANK */}
                    <td className="px-6 py-5 text-center">
                      {index === 0 ? (
                        <div className="mx-auto w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 text-black flex items-center justify-center shadow-lg shadow-yellow-500/30">
                          <Trophy size={18} />
                        </div>
                      ) : (
                        <div className="mx-auto w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-black text-sm group-hover:text-indigo-400">
                          #{index + 1}
                        </div>
                      )}
                    </td>

                    {/* 📦 PRODUCT */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">

                        {/* IMAGE */}
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                          <div className="relative w-16 h-16 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
                            <img
                              src={product.thumbnail}
                              alt={product?.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500";
                              }}
                            />
                          </div>
                        </div>

                        {/* INFO */}
                        <div className="max-w-[280px]">

                          <h3 className="text-white font-black text-sm truncate group-hover:text-indigo-400 transition-colors">
                            {product?.name || "Product Node"}
                          </h3>

                          <div className="flex items-center gap-3 mt-2 flex-wrap">

                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                              <Package2 size={11} />
                              Inventory Stream
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                              <Eye size={11} />
                              {product.reviews} Reviews
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY */}
                    <td className="px-6 py-5">
                      <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[10px] uppercase tracking-widest font-black">
                        {product.category}
                      </span>
                    </td>

                    {/* SOLD */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-white font-black text-lg">
                          {product.sold}
                        </span>

                        <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">
                          Units Sold
                        </span>
                      </div>
                    </td>

                    {/* REVENUE */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-black text-base">
                          ₹{product.revenue.toLocaleString("en-IN")}
                        </span>

                        <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">
                          Gross Revenue
                        </span>
                      </div>
                    </td>

                    {/* PRICE */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-indigo-400 font-black text-sm">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>

                        <span className="text-slate-500 text-[10px] uppercase tracking-widest font-black">
                          Unit Price
                        </span>
                      </div>
                    </td>

                    {/* RATING */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 w-max">

                        <Star
                          size={14}
                          className="fill-amber-400 text-amber-400"
                        />

                        <span className="text-amber-300 font-black text-sm">
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* STOCK */}
                    <td className="px-6 py-5">
                      <div className="w-[140px]">

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                            Remaining
                          </span>

                          <span className="text-white text-xs font-black">
                            {product.stock}
                          </span>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                            style={{
                              width: `${Math.min(
                                100,
                                (product.stock / 500) * 100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* PERFORMANCE */}
                    <td className="px-6 py-5">
                      <span
                        className={`px-4 py-2 rounded-2xl border text-[10px] uppercase tracking-[0.18em] font-black ${performance.color}`}
                      >
                        {performance.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="py-24 text-center"
                >
                  <div className="flex flex-col items-center gap-4">

                    <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                      <Boxes
                        size={34}
                        className="text-slate-700 animate-pulse"
                      />
                    </div>

                    <div>
                      <h3 className="text-slate-300 font-black uppercase tracking-[0.2em] text-xs">
                        No Product Analytics Available
                      </h3>

                      <p className="text-slate-600 text-xs mt-2">
                        Waiting for live inventory database streams...
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🚀 FOOTER */}
      <div className="px-6 py-5 border-t border-slate-800/60 bg-slate-950/40 flex flex-col lg:flex-row items-center justify-between gap-4">

        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-black uppercase tracking-widest">
          <BarChart3 size={13} className="text-indigo-400" />
          Real-time ranking engine enabled
        </div>

        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-slate-600">
          <ShoppingBag size={12} />
          Spectrum Commerce Analytics
        </div>
      </div>
    </div>
  );
};

export default TopSellingProducts;