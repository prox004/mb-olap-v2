import React from "react";
import ComponentCard from "../../common/ComponentCard";
import CardOne from "./CardOne";
import CardTwo from "./CardTwo";
import CardThree from "./CardThree";

export default function CardWithImage() {
  return (
    <ComponentCard title="Card with Image">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <CardOne />
        </div>
        <div>
          <CardTwo />
        </div>
        <div>
          <CardThree />
        </div>
      </div>
    </ComponentCard>
  );
}
