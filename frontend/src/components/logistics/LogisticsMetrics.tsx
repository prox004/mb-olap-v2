import { BoxMoving, BoxTapped, TruckDelivery } from "../../icons";

export default function LogisticsMetrics() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <article className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90">
          <BoxTapped className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            12,384
          </h3>
          <p className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            Total Orders
            <span className="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium">
              +20%
            </span>
          </p>
        </div>
      </article>
      <article className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90">
          <TruckDelivery className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            728
          </h3>
          <p className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            Orders in Transit
            <span className="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium">
              +20%
            </span>
          </p>
        </div>
      </article>
      <article className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90">
          <BoxMoving className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            12,384
          </h3>
          <p className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            Total Orders
            <span className="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium">
              +20%
            </span>
          </p>
        </div>
      </article>
    </div>
  );
}
