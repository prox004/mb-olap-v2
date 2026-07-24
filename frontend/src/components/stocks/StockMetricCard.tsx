import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "../../icons";
import Image from "next/image";

type StockCardProps = {
  imgUrl: string;
  symbol: string;
  companyName: string;
  price: string;
  change: string;
  changeDirection: "up" | "down"; // Direction of the price change
};

// Component rendering
const StockCard: React.FC<StockCardProps> = ({
  imgUrl,

  companyName,
  price,
  change,
  changeDirection,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10">
          <Image
            width={40}
            height={40}
            className="w-full"
            src={imgUrl}
            alt={companyName}
          />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {companyName}
          </h3>
          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
            {companyName}
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {price}
          </h4>
        </div>
        <Badge
          variant="light"
          color={changeDirection === "up" ? "success" : "error"}
          startIcon={
            changeDirection === "up" ? <ArrowUpIcon /> : <ArrowDownIcon />
          }
        >
          {change}
        </Badge>
      </div>
    </div>
  );
};

export default StockCard;
