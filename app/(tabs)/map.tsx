import MapWithPins, { MapItem } from "../../components/UI/MapWithPins";
import { Api } from "../../services/api";

async function fetchByBBox(
  n: number,
  e: number,
  s: number,
  w: number
): Promise<MapItem[]> {
  const res = await Api.listFoundItemsBBox(n, e, s, w);
  return res.items as MapItem[];
}

export default function MapScreen() {
  return <MapWithPins fetchByBBox={fetchByBBox} idleMs={400} />;
}
