import React, { useMemo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Boxes,
  Sparkles,
  RefreshCw,
} from "lucide-react";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#ec4899",
  "#f59e0b",
  "#3b82f6",
  "#a78bfa",
  "#06b6d4",
  "#f43f5e",
  "#14b8a6",
  "#8b5cf6",
];

const UltraTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;

    return (
      <div className="backdrop-blur-2xl bg-[#0f172acc] border border-slate-700/50 shadow-2xl rounded-2xl p-4 min-w-[170px]">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: item.fillColor }}
          />
          <p className="text-white text-sm font-bold tracking-wide">
            {item.status}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-slate-300 text-xs">
            Products :
            <span className="text-white font-bold ml-1">{item.count}</span>
          </p>

          <p className="text-slate-300 text-xs">
            Share :
            <span className="text-emerald-400 font-bold ml-1">
              {item.percentage}%
            </span>
          </p>
        </div>
      </div>
    );
  }

  return null;
};

const OrdersChart = () => {
  const { allProducts: products } = useSelector((state) => state.product || {});

  // REAL TIME CLOCK
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock removed so it doesn't cause constant re-renders

  // LIVE DATA GENERATION
  const chartData = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    const categoryMap = {};

    products.forEach((product) => {
      let category = "General";

      if (product?.category) {
        if (typeof product.category === "string") {
          category = product.category;
        } else if (
          Array.isArray(product.category) &&
          product.category.length > 0
        ) {
          category = product.category[0];
        }
      }

      const cleanKey = category.trim().toUpperCase();

      categoryMap[cleanKey] = (categoryMap[cleanKey] || 0) + 1;
    });

    const total = Object.values(categoryMap).reduce(
      (acc, val) => acc + val,
      0
    );

    return Object.keys(categoryMap).map((cat, index) => ({
      status: cat.charAt(0) + cat.slice(1).toLowerCase(),
      count: categoryMap[cat],
      percentage: ((categoryMap[cat] / total) * 100).toFixed(1),
      fillColor: COLORS[index % COLORS.length],
    }));
  }, [products]);

  const totalProducts = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  // REAL TIME AUTO UPDATE ANIMATION
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);

    const timeout = setTimeout(() => {
      setPulse(false);
    }, 700);

    return () => clearTimeout(timeout);
  }, [products]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#111827] shadow-[0_0_80px_rgba(99,102,241,0.15)] p-5 w-full min-h-[420px]">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full" />

      {/* HEADER */}
      <div className="relative z-10 flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
              <Sparkles size={18} className="text-indigo-400" />
            </div>

            <div>
              <h2 className="text-white text-xl font-black tracking-tight">
                Product Analytics
              </h2>

              <p className="text-slate-400 text-xs font-medium mt-0.5">
                Real-time category distribution monitor
              </p>
            </div>
          </div>
        </div>

        {/* LIVE STATUS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="relative">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping absolute" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full relative" />
            </div>

            <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              Live
            </span>
          </div>

          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-slate-400 text-[10px] uppercase font-bold">
              Updated
            </p>

            <p className="text-white text-xs font-bold mt-0.5">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] uppercase font-bold">
                Total Products
              </p>

              <h1
                className={`text-3xl font-black text-white mt-1 transition-all duration-500 ${
                  pulse ? "scale-110 text-indigo-400" : ""
                }`}
              >
                {totalProducts}
              </h1>
            </div>

            <Boxes className="text-indigo-400" size={28} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] uppercase font-bold">
                Categories
              </p>

              <h1 className="text-3xl font-black text-white mt-1">
                {chartData.length}
              </h1>
            </div>

            <Activity className="text-cyan-400" size={28} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-4 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-[11px] uppercase font-bold">
                Trending
              </p>

              <h1 className="text-3xl font-black text-emerald-400 mt-1">
                +12%
              </h1>
            </div>

            <TrendingUp className="text-emerald-400" size={28} />
          </div>
        </div>
      </div>

      {/* MAIN CHART */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6">
        
        {/* CHART */}
        <div className="w-full lg:w-[52%] h-[280px] relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
              Inventory
            </p>

            <h1 className="text-5xl font-black text-white mt-1 tracking-tight">
              {totalProducts}
            </h1>

            <div className="flex items-center gap-1 mt-2">
              <RefreshCw
                size={12}
                className="text-emerald-400 animate-spin"
              />

              <span className="text-emerald-400 text-[10px] font-bold uppercase">
                Syncing Live
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <Tooltip content={<UltraTooltip />} />

              

              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={5}
                stroke="transparent"
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fillColor}
                    style={{
                      filter: "url(#glow)",
                    }}
                    className="hover:opacity-80 transition-all duration-300 cursor-pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* CATEGORY LIST */}
        <div className="w-full lg:w-[48%] flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {chartData.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-4 hover:border-slate-700 transition-all duration-300 shrink-0"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, ${item.fillColor}15, transparent)`,
                  }}
                />
              </div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full shadow-lg shrink-0"
                    style={{
                      background: item.fillColor,
                      boxShadow: `0 0 15px ${item.fillColor}`,
                    }}
                  />

                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-sm">
                      {item.status}
                    </h3>

                    <p className="text-slate-400 text-xs mt-0.5">
                      {item.percentage}% of inventory
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-white text-xl font-black">
                    {item.count}
                  </h2>

                  <p className="text-slate-500 text-[10px] uppercase font-bold">
                    Units
                  </p>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${item.percentage}%`,
                    background: item.fillColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersChart;