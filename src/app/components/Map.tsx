"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getGeoData } from "../utilities/geoData";
import Tooltip from "./Tooltip";
import { fetchStateData, fetchCountyData } from "../utilities/dataFetchers";

const Map = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const [currentStateId, setCurrentStateId] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [stateData, setStateData] = useState(null);
  const [countyData, setCountyData] = useState(null);

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
          showStateData(stateId);
        })
        .on("mouseover", async (event, d) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          const normalizedStateId = d.id.padStart(2, "0") + "000";
          console.log(`Fetching state data for GeoFips: ${normalizedStateId}`);
          try {
            const data = await fetchStateData(normalizedStateId);
            const allIndustryData = data?.find(
              (item) => item.Description === "All industry total"
            );
            const gdp = allIndustryData?.["2023"] || "Data unavailable";
            setTooltipContent(`${d.properties.name} GDP: $${gdp}`);
          } catch (error) {
            console.error(
              "Error fetching state data:",
              error,
              "GeoFips:",
              normalizedStateId
            );
            setTooltipContent(`${d.properties.name} GDP: Data unavailable`);
          }
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
        .on("mouseover", async (event, d) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          const normalizedCountyId = d.id.padStart(5, "0");
          console.log(`Hovering over county GeoFips: ${normalizedCountyId}`);
          try {
            const data = await fetchCountyData(normalizedCountyId);
            const allIndustryData = data?.find(
              (item) => item.Description === "All industry total"
            );
            const gdp = allIndustryData?.["2023"] || "Data unavailable";
            setTooltipContent(`${d.properties.name} GDP: $${gdp}`);
          } catch (error) {
            console.error(
              "Error fetching county data:",
              error,
              "GeoFips:",
              normalizedCountyId
            );
            setTooltipContent(`${d.properties.name} GDP: Data unavailable`);
          }
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

  const showStateData = async (stateId: string) => {
    try {
      const normalizedStateId = stateId.padStart(2, "0") + "000";
      const data = await fetchStateData(normalizedStateId);
      const allIndustryData = data?.find(
        (item) => item.Description === "All industry total"
      );
      const gdp = allIndustryData?.["2023"] || "Data unavailable";
      setStateData([{ name: "All Industry Total", value: gdp }]);
    } catch (error) {
      console.error("Error fetching state data:", error);
    }
  };

  const showCountyData = async (countyId: string) => {
    try {
      const normalizedCountyId = countyId.padStart(5, "0");
      const data = await fetchCountyData(normalizedCountyId);

      if (!data || data.length === 0) {
        console.warn("No data found for county GeoFips:", normalizedCountyId);
      }

      const countyDataWithKey = data?.map((item, index) => ({
        ...item,
        key: index,
      })); // Add unique keys
      setCountyData(countyDataWithKey);
    } catch (error) {
      console.error("Error fetching county data:", error);
    }
  };

  return (
    <div className='relative'>
      <svg ref={svgRef} className='border border-black'>
        <g ref={gRef}></g>
      </svg>
      {stateData && (
        <div className='absolute top-4 left-4 bg-white p-4 rounded shadow-md'>
          <h3>State Data</h3>
          <ul>
            {stateData.map((item, index) => (
              <li key={index}>
                {item.name}: {item.value}
              </li>
            ))}
          </ul>
        </div>
      )}
      {countyData && (
        <div className='absolute top-4 right-4 bg-white p-4 rounded shadow-md'>
          <h3>County Data</h3>
          <ul>
            {countyData.map((county) => (
              <li key={county.key}>
                {county.name}: {county.value}
              </li>
            ))}
          </ul>
        </div>
      )}
      {tooltipContent && (
        <Tooltip
          content={tooltipContent}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        />
      )}
    </div>
  );
};

export default Map;
