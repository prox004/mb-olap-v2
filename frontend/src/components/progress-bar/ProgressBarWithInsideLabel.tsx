import React from "react";
import ProgressBar from "./ProgressBar";

export default function ProgressBarWithInsideLabel() {
  return (
    <div className="space-y-5 sm:max-w-[320px] w-full">
      <ProgressBar progress={40} size="lg" label="inside" />
      <ProgressBar progress={70} size="lg" label="inside" />
      <ProgressBar progress={30} size="lg" label="inside" />
    </div>
  );
}
