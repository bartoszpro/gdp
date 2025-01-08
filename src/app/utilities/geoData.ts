import { feature } from "topojson-client";
import type { Topology, GeometryObject } from "topojson-specification";
import statesJson from "../../../public/states-albers-10m.json";
import countiesJson from "../../../public/counties-albers-10m.json";

interface FixedTopology extends Topology {
  transform: {
    scale: [number, number];
    translate: [number, number]; 
  };
  objects: {
    states: GeometryObject;
    counties: GeometryObject;
  };
}

export const getGeoData = () => {
  const statesData = feature(
    statesJson as unknown as FixedTopology,
    statesJson.objects.states as GeometryObject
  ) as GeoJSON.FeatureCollection<GeoJSON.Geometry>;

  const countiesData = feature(
    countiesJson as unknown as FixedTopology,
    countiesJson.objects.counties as GeometryObject
  ) as GeoJSON.FeatureCollection<GeoJSON.Geometry>;

  return { statesData, countiesData };
};
