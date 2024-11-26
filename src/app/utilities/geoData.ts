import { feature } from "topojson-client";
import statesJson from "../../../public/states-albers-10m.json";
import countiesJson from "../../../public/counties-albers-10m.json";

export const getGeoData = () => {
  const statesData = feature(
    statesJson as any,
    statesJson.objects.states
  ) as GeoJSON.FeatureCollection<GeoJSON.Geometry>;

  const countiesData = feature(
    countiesJson as any,
    countiesJson.objects.counties
  ) as GeoJSON.FeatureCollection<GeoJSON.Geometry>;

  return { statesData, countiesData };
};
