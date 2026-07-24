import ComponentCard from "../../common/ComponentCard";
import CardFour from "./CardFour";
import CardFive from "./CardFive";

export default function HorizontalCardWithImage() {
  return (
    <ComponentCard title="Horizontal Card with Image">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <CardFour />
        <CardFive />
      </div>
    </ComponentCard>
  );
}
