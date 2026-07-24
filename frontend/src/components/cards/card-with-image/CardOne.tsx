import React from "react";
import { Card, CardDescription, CardTitle } from "../../ui/card";
import Link from "next/link";
import Image from "next/image";

export default function CardOne() {
  return (
    <Card>
      <div>
        <div className="mb-5 overflow-hidden rounded-lg">
          <Image
            src="/images/cards/card-01.png"
            alt="card"
            className="w-full overflow-hidden rounded-lg"
            width={303}
            height={190}
          />
        </div>
        <div>
          {/* <h4 className="mb-1 font-medium text-gray-800 text-theme-xl dark:text-white/90"></h4> */}
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
    </Card>
  );
}
