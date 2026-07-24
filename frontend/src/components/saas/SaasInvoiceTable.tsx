import Badge from "../ui/badge/Badge";

const transactions = [
  {
    id: "#DF429",
    date: "April 28, 2016",
    user: "Jenny Wilson",
    amount: "$473.85",
    status: "Complete" as const,
  },
  {
    id: "#HTY274",
    date: "October 30, 2017",
    user: "Wade Warren",
    amount: "$293.01",
    status: "Complete" as const,
  },
  {
    id: "#LKE600",
    date: "May 29, 2017",
    user: "Darlene Robertson",
    amount: "$782.01",
    status: "Pending" as const,
  },
  {
    id: "#HRP447",
    date: "May 20, 2015",
    user: "Arlene McCoy",
    amount: "$202.87",
    status: "Cancelled" as const,
  },
  {
    id: "#WRH647",
    date: "March 13, 2014",
    user: "Bessie Cooper",
    amount: "$490.51",
    status: "Complete" as const,
  },
];

export default function SaasInvoiceTable() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Invoices
        </h3>
      </div>
      <div className="custom-scrollbar overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                Serial No:
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                Close Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                User
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* <tr>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                #DF429
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                April 28, 2016
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                Jenny Wilson
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                $473.85
              </td>
              <td className="px-6 py-4 text-left">
                <span className="bg-success-50 text-theme-xs text-success-600 dark:bg-success-500/15 dark:text-success-500 rounded-full px-2 py-0.5 font-medium">
                  Complete
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                #HTY274
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                October 30, 2017
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                Wade Warren
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                $293.01
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                <span className="bg-success-50 text-theme-xs text-success-600 dark:bg-success-500/15 dark:text-success-500 rounded-full px-2 py-0.5 font-medium">
                  Complete
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                #LKE600
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                May 29, 2017
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                Darlene Robertson
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                $782.01
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                <span className="bg-warning-50 text-theme-xs text-warning-600 dark:bg-warning-500/15 dark:text-warning-500 rounded-full px-2 py-0.5 font-medium">
                  Pending
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                #HRP447
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                May 20, 2015
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                Arlene McCoy
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                $202.87
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                <span className="bg-error-50 text-theme-xs text-error-600 dark:bg-error-500/15 dark:text-error-500 rounded-full px-2 py-0.5 font-medium">
                  Cancelled
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                #WRH647
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                March 13, 2014
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                Bessie Cooper
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                $490.51
              </td>
              <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                <span className="bg-success-50 text-theme-xs text-success-600 dark:bg-success-500/15 dark:text-success-500 rounded-full px-2 py-0.5 font-medium">
                  Complete
                </span>
              </td>
            </tr> */}
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                  {transaction.id}
                </td>
                <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                  {transaction.date}
                </td>
                <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                  {transaction.user}
                </td>
                <td className="px-6 py-4 text-left text-sm whitespace-nowrap text-gray-700 dark:text-gray-400">
                  {transaction.amount}
                </td>
                <td className="px-6 py-4 text-left">
                  <Badge
                    size="sm"
                    color={
                      transaction.status === "Complete"
                        ? "success"
                        : transaction.status === "Pending"
                        ? "warning"
                        : "error"
                    }
                  >
                    {transaction.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
