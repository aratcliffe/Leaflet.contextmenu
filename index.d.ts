import { LatLng, Point, Marker, Path } from "leaflet";

declare module 'leaflet' {
  interface ContextMenuItem {
      text: string;
      icon: string;
      index?: number
      callback?: (ev: ContextMenuItemClickEvent, map?: Map) => void;
  }

  interface MapOptions {
      contextmenu: boolean;
      contextmenuItems: ContextMenuItem[]
  }

  interface MarkerOptions {
      contextmenu: boolean;
      contextmenuItems: ContextMenuItem[]
  }

  interface ContextMenuItemClickEvent {
      latlng: LatLng;
      layerPoint: Point;
      containerPoint: Point;
      relatedTarget: Marker | Path | undefined;
  }
}
