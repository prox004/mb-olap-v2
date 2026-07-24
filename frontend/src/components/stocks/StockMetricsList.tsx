import StockCard from "./StockMetricCard";

type StockCardProps = {
  imgUrl: string;
  symbol: string;
  companyName: string;
  price: string;
  change: string;
  changeDirection: "up" | "down"; // Direction of the price change
};

const stockData: StockCardProps[] = [
  {
    imgUrl: "/images/brand/brand-07.svg",
    symbol: "APPL",
    companyName: "Apple, Inc",
    price: "$1,232.00",
    change: "11.01%",
    changeDirection: "up",
  },

  {
    imgUrl: "/images/brand/brand-08.svg",
    symbol: "PYPL",
    companyName: "Paypal, Inc",
    price: "$965.00",
    change: "9.05%",
    changeDirection: "down",
  },
  {
    imgUrl: "/images/brand/brand-09.svg",
    symbol: "TSLA",
    companyName: "Tesla, Inc",
    price: "$1,232.00",
    change: "11.01%",
    changeDirection: "up",
  },
  {
    imgUrl: "/images/brand/brand-10.svg",
    symbol: "AMZN",
    companyName: "Amazon.com, Inc",
    price: "$2,567.00",
    change: "11.01%",
    changeDirection: "up",
  },
];

export default function StockMetricsList() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
      {stockData.map((stock, i) => (
        <StockCard key={i + 1} {...stock} />
      ))}
    </div>
  );
}
