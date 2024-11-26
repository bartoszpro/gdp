"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getGeoData } from "../utilities/geoData";
import Tooltip from "./Tooltip"
const Map = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [currentStateId, setCurrentStateId] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const { statesData, countiesData } = getGeoData();
    const width = 1280;
    const height = 800;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = d3.select(gRef.current);
    const projection = d3.geoIdentity().fitSize([width, height], statesData);
    const path = d3.geoPath(projection);

    const drawStates = () => {
      g.selectAll(".state")
        .data(statesData.features)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", "#69b3a2")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.3)
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          const stateId = d.id as string;
          setCurrentStateId(stateId);
          zoomToState(d, path);
          drawCounties(stateId);
        })
        .on("mouseover", (event, d) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          setTooltipContent(d.properties.name);
          setTooltipPosition({ x: x + 15, y: y + 15 });
        })
        .on("mousemove", (event) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          setTooltipPosition({ x: x + 15, y: y + 15 });
        })
        .on("mouseout", () => {
          setTooltipContent(null);
        });
    };

    const drawCounties = (stateId: string) => {
      const stateCounties = countiesData.features.filter((county) =>
        county.id.startsWith(stateId)
      );

      g.selectAll(".county")
        .data(stateCounties)
        .join("path")
        .attr("class", "county")
        .attr("d", path)
        .attr("fill", "#b3e2cd")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.1)
        .on("mouseover", (event, d) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          setTooltipContent(d.properties.name);
          setTooltipPosition({ x: x + 15, y: y + 15 });
        })
        .on("mousemove", (event) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          setTooltipPosition({ x: x + 15, y: y + 15 });
        })
        .on("mouseout", () => {
          setTooltipContent(null);
        });
    };

    const zoomToState = (feature, path) => {
      const [[x0, y0], [x1, y1]] = path.bounds(feature);
      const dx = x1 - x0;
      const dy = y1 - y0;
      const x = (x0 + x1) / 2;
      const y = (y0 + y1) / 2;
      const scale = Math.max(
        1,
        Math.min(8, 0.9 / Math.max(dx / width, dy / height))
      );
      const translate = [width / 2 - scale * x, height / 2 - scale * y];

      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
    };

    const resetZoom = () => {
      setCurrentStateId(null);
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      g.selectAll(".county").remove();
      drawStates();
    };

    const zoom = d3
      .zoom()
      .filter((event) => {
        if (event.type === "dblclick") {
          resetZoom();
          return false;
        }
        return event.type !== "wheel" && event.type !== "touchmove";
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    drawStates();

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") resetZoom();
    });

    return () => {
      window.removeEventListener("keydown", (event) => {
        if (event.key === "Escape") resetZoom();
      });
    };
  }, []);

  return (
    <div className="relative">
      <svg ref={svgRef} className="border border-black">
        <g ref={gRef}></g>
      </svg>
      {tooltipContent && (
        <Tooltip content={tooltipContent} x={tooltipPosition.x} y={tooltipPosition.y} />
      )}
    </div>
  );
};

export default Map;
