import Link from "next/link";
import { CardDescription, CardTitle } from "../../ui/card";
import Image from "next/image";

export default function CardFour() {
  return (
    <div>
      <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-6">
        <div className="overflow-hidden rounded-lg">
          <Image
            width={224}
            height={140}
            src="/images/cards/card-01.png"
            alt="card"
            className="w-full overflow-hidden rounded-lg"
          />
        </div>
        <div>
          <CardTitle>Card title</CardTitle>

          <CardDescription>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi
            architecto aspernatur cum et ipsum
          </CardDescription>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-3 mt-4 text-sm font-medium text-white rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
          >
            Read more
          </Link>
        </div>
      </div>
    </div>
  );
}
