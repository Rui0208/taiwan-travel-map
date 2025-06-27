declare module "react-svg-map" {
  import { ComponentType, MouseEvent } from "react";

  export interface SVGMapProps {
    map: {
      viewBox: string;
      locations: Array<{
        path: string;
        id: string;
        name: string;
      }>;
    };
    className?: string;
    locationClassName?: string;
    onLocationMouseOver?: (event: MouseEvent<SVGElement>) => void;
    onLocationMouseOut?: (event: MouseEvent<SVGElement>) => void;
    onLocationClick?: (event: MouseEvent<SVGElement>) => void;
  }

  export const SVGMap: ComponentType<SVGMapProps>;
}
