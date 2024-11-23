'use client';

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { Topology } from "topojson-specification";
import statesJson from "../../public/states-albers-10m.json";
import countiesJson from "../../public/counties-albers-10m.json";

export default function Home() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [currentStateId, setCurrentStateId] = useState<string | null>(null);

  useEffect(() => {
    const width = 960;
    const height = 600;

    // extract the geojson for states and counties
    const statesData = feature(
      statesJson as unknown as Topology,
      statesJson.objects.states
    ) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry>;

    const countiesData = feature(
      countiesJson as unknown as Topology,
      countiesJson.objects.counties
    ) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry>;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = d3.select(gRef.current);

    const projection = d3.geoIdentity().fitSize([width, height], statesData);
    const path = d3.geoPath(projection);

    // draw states
    const drawStates = (highlightStateId: string | null = null) => {
      g.selectAll(".state")
        .data(statesData.features)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", (d) => (d.id === highlightStateId ? "#fdd835" : "#69b3a2"))
        .attr("stroke", "#000")
        .attr("stroke-width", (d) => (d.id === highlightStateId ? .5 : 1))
        .on("click", (event, d) => {
          const stateId = d.id as string;
          setCurrentStateId(stateId);
          zoomToState(d, path);
          drawCounties(stateId);
        });
    };

    // draw counties for a state
    const drawCounties = (stateId: string) => {
      const stateCounties = countiesData.features.filter((county) =>
        county.id.startsWith(stateId)
      );

      console.log("Filtered Counties for State:", stateId, stateCounties);

      g.selectAll(".county")
        .data(stateCounties)
        .join("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("fill", "#b3e2cd")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.2) 
        .on("click", () => {
          console.log("County clicked!");
        });
    };

    const zoomToState = (feature, path) => {
      const [[x0, y0], [x1, y1]] = path.bounds(feature);
      const dx = x1 - x0;
      const dy = y1 - y0;
      const x = (x0 + x1) / 2;
      const y = (y0 + y1) / 2;
      const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
      const translate = [width / 2 - scale * x, height / 2 - scale * y];

      svg.transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );

      drawStates(feature.id as string);
    };

    const resetZoom = () => {
      setCurrentStateId(null);

      svg.transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity
        );

      g.selectAll(".county").remove();
      drawStates();
    };

    const zoom = d3
      .zoom()
      .filter((event) => {
        return event.type === "wheel" || event.type === "dblclick";
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    drawStates();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div>
      <svg ref={svgRef} style={{ border: "1px solid red" }}>
        <g ref={gRef}></g>
      </svg>
    </div>
  );
}
