import React from "react";
import ProgressBar from "./ProgressBar";

export default function ProgressBarWithOutsideLabel() {
  return (
    <div className="space-y-5">
      <ProgressBar progress={40} label="outside" className="sm:max-w-[320px]" />
      <ProgressBar progress={70} label="outside" className="sm:max-w-[320px]" />
      <ProgressBar progress={30} label="outside" className="sm:max-w-[320px]" />
    </div>
  );
}
