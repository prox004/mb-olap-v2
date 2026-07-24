import React from "react";
import ProgressBar from "./ProgressBar";

export default function DefaultProgressbarExample() {
  return (
    <div className="space-y-5 sm:max-w-[320px] w-full">
      <ProgressBar progress={55} />
      <ProgressBar progress={85} />
      <ProgressBar progress={35} />
    </div>
  );
}
