// svg.d.ts
declare module "*.svg" {
  import * as React from "react";
  const content: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }>;
  export default content;
}
