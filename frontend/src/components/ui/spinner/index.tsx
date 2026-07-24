import ComponentCard from "../../common/ComponentCard";
import SpinnerOne from "./SpinnerOne";
import SpinnerTwo from "./SpinnerTwo";
import SpinnerThree from "./SpinnerThree";
import SpinnerFour from "./SpinnerFour";

export default function SpinnerExample() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <ComponentCard title="Spinner 1">
        <SpinnerOne />
      </ComponentCard>{" "}
      <ComponentCard title="Spinner 2">
        <SpinnerTwo />
      </ComponentCard>{" "}
      <ComponentCard title="Spinner 3">
        <SpinnerThree />
      </ComponentCard>{" "}
      <ComponentCard title="Spinner 4">
        <SpinnerFour />
      </ComponentCard>
    </div>
  );
}
