import React from "react";
import { VelocityBreakdownItem } from "@/hooks/useMerchandiseData";

interface VelocitySummaryCardsProps {
  breakdown: VelocityBreakdownItem[];
  loading?: boolean;
}

export const VelocitySummaryCards: React.FC<VelocitySummaryCardsProps> = ({ breakdown, loading }) => {
  const getStats = (status: string) => {
    const item = breakdown.find((b) => b.velocity_status === status);
    return {
      count: item?.sku_count || 0,
      stockValue: item?.closing_stock_value || 0,
    };
  };

  const fast = getStats("FAST_MOVER");
  const medium = getStats("MEDIUM_MOVER");
  const slow = getStats("SLOW_MOVER");
  const dead = getStats("DEAD_STOCK");

  const formatLakhs = (val: number) => {
    const lakhs = val / 100000;
    return `₹${lakhs.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`;
  };

  const cards = [
    {
      title: "Fast Movers",
      tag: "WOC < 4 Wks",
      count: fast.count,
      stockValue: formatLakhs(fast.stockValue),
      icon: "🚀",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      borderColor: "border-l-emerald-500",
    },
    {
      title: "Medium Movers",
      tag: "WOC 4-12 Wks",
      count: medium.count,
      stockValue: formatLakhs(medium.stockValue),
      icon: "⚖️",
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      borderColor: "border-l-blue-500",
    },
    {
      title: "Slow Movers",
      tag: "WOC > 12 Wks",
      count: slow.count,
      stockValue: formatLakhs(slow.stockValue),
      icon: "🐢",
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      borderColor: "border-l-amber-500",
    },
    {
      title: "Dead Stock",
      tag: "0 Sales / Stock > 0",
      count: dead.count,
      stockValue: formatLakhs(dead.stockValue),
      icon: "💀",
      badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      borderColor: "border-l-rose-500",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className={`p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-l-4 ${c.borderColor} shadow-xs flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">{c.icon}</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${c.badgeColor}`}>
              {c.tag}
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {c.title}
            </h3>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                {c.count.toLocaleString()} <span className="text-xs font-normal text-gray-500">SKUs</span>
              </span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {c.stockValue}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
