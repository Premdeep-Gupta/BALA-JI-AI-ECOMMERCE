import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";

import {
  Package2,
  TrendingUp,
  Layers3,
  Database,
} from "lucide-react";

/* =========================================================
   CUSTOM TOOLTIP
========================================================= */
const CustomProTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="min-w-[220px] rounded-2xl border border-slate-700/60 bg-[#0f172a]/95 backdrop-blur-xl p-4 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20">
          <Package2 size={15} className="text-indigo-400" />
        </div>

        <div>
          <p className="text-xs font-black text-white truncate">
            {data.name}
          </p>

          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Inventory Category
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400">
            Total Stock
          </span>

          <span className="text-sm font-black text-emerald-400">
            {data.total_sold}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400">
            Contribution
          </span>

          <span className="text-sm font-black text-indigo-400">
            {data.percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   ADVANCED TOP PRODUCTS CHART
========================================================= */
const TopProductsChart = () => {
  const { allProducts: products = [] } = useSelector(
    (state) => state.product || {}
  );

  /* =========================================================
     PROCESS DATA
  ========================================================= */
  const processedData = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return [
        {
          name: "No Data",
          total_sold: 0,
          percentage: 0,
        },
      ];
    }

    // Filter products created in the last 30 days (a month)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProducts = products.filter((product) => {
      const createdAt = new Date(product?.created_at || product?.createdAt || Date.now());
      return createdAt >= thirtyDaysAgo;
    });

    const activeProducts = recentProducts.length > 0 ? recentProducts : products;

    const categoryMap = {};

    activeProducts.forEach((product) => {
      let category = product?.category || "General";

      if (Array.isArray(category)) {
        category = category[0];
      }

      category = String(category).trim();

      const formattedCategory =
        category.charAt(0).toUpperCase() +
        category.slice(1).toLowerCase();

      categoryMap[formattedCategory] =
        (categoryMap[formattedCategory] || 0) +
        (Number(product?.stock) || 0);
    });

    const totalStock = Object.values(categoryMap).reduce(
      (acc, value) => acc + value,
      0
    );

    return Object.entries(categoryMap)
      .map(([name, total]) => ({
        name,
        total_sold: total,
        percentage:
          totalStock > 0
            ? ((total / totalStock) * 100).toFixed(1)
            : 0,
      }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);
  }, [products]);

  /* =========================================================
     COLORS
  ========================================================= */
  const chartColors = [
    "#6366f1",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ec4899",
  ];

  /* =========================================================
     TOTAL METRICS
  ========================================================= */
  const totalProducts = products?.length || 0;

  const totalStock = processedData.reduce(
    (acc, item) => acc + item.total_sold,
    0
  );

  return (
    <div className="w-full">
      {/* =========================================================
          TOP STATS
      ========================================================= */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        {/* TOTAL CATEGORIES */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Categories
              </p>

              <h3 className="mt-1 text-2xl font-black text-white">
                {processedData.length}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15">
              <Layers3 size={20} className="text-indigo-400" />
            </div>
          </div>
        </div>

        {/* TOTAL STOCK */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Total Stock
              </p>

              <h3 className="mt-1 text-2xl font-black text-white">
                {totalStock}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15">
              <Database size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          CHART
      ========================================================= */}
      <div className="relative h-[320px] w-full overflow-hidden rounded-[2rem] border border-slate-800/50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 shadow-2xl">
        {/* GLOW */}
        <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-[80px]" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <TrendingUp
                size={15}
                className="text-indigo-400"
              />
              Inventory Density Matrix
            </h2>

            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Real-time category stock analytics
            </p>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              Live
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height="82%">
          <BarChart
            data={processedData}
            layout="vertical"
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 5,
            }}
            barCategoryGap={20}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#1e293b"
              opacity={0.25}
            />

            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: 11,
                fontWeight: 700,
              }}
            />

            <YAxis
              type="category"
              dataKey="name"
              width={90}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#cbd5e1",
                fontSize: 11,
                fontWeight: 800,
              }}
            />

            <Tooltip
              content={<CustomProTooltip />}
              cursor={{
                fill: "#334155",
                opacity: 0.08,
              }}
            />

            <Bar
              dataKey="total_sold"
              radius={[0, 10, 10, 0]}
              barSize={18}
              animationDuration={1800}
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    chartColors[
                      index % chartColors.length
                    ]
                  }
                  className="cursor-pointer transition-all duration-300 hover:opacity-80"
                />
              ))}

              <LabelList
                dataKey="total_sold"
                position="right"
                style={{
                  fill: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* =========================================================
          FOOTER INFO
      ========================================================= */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Products Loaded
          </p>

          <h3 className="mt-1 text-xl font-black text-white">
            {totalProducts}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Highest Category
          </p>

          <h3 className="mt-1 truncate text-xl font-black text-indigo-400">
            {processedData?.[0]?.name || "N/A"}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default TopProductsChart;