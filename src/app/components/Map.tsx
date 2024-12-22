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
  const [isLoading, setIsLoading] = useState(false);
  const [isCountyLoading, setIsCountyLoading] = useState(false);

  useEffect(() => {
    const { statesData, countiesData } = getGeoData();
    const aspectRatio = 16 / 9;
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", "0 0 1280 720")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("responsive-svg", true);

    const g = d3.select(gRef.current);
    const projection = d3.geoIdentity().fitSize([1280, 720], statesData);
    const path = d3.geoPath(projection);

    const drawStates = async () => {
      setIsLoading(true);

      try {
        const stateGDPMap: Record<string, number> = {};
        const stateFetchPromises = statesData.features.map(async (state) => {
          const normalizedStateId = state.id.padStart(2, "0") + "000";
          try {
            const data = await fetchStateData(normalizedStateId);
            const allIndustryData = data?.find(
              (item) => item.Description === "All industry total"
            );
            const gdp = allIndustryData?.["2023"] || 0;
            stateGDPMap[state.id] = gdp;
          } catch (error) {
            console.error(`Error fetching GDP for state ${state.id}:`, error);
            stateGDPMap[state.id] = 0;
          }
        });

        await Promise.all(stateFetchPromises);

        const minGDP = Math.min(...Object.values(stateGDPMap));
        const maxGDP = Math.max(...Object.values(stateGDPMap));
        const colorScale = d3
          .scaleLinear<string>()
          .domain([minGDP, minGDP + (maxGDP - minGDP) * 0.2, maxGDP])
          .range(["#ffe6e6", "#ff9999", "#cc0000"]);

        g.selectAll(".state")
          .data(statesData.features)
          .join("path")
          .attr("class", "state")
          .attr("d", path)
          .attr("fill", (d) => colorScale(stateGDPMap[d.id] || 0))
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
          .on("mouseover", (event, d) => {
            const container = svgRef.current?.getBoundingClientRect();
            const offsetX = container?.left || 0;
            const offsetY = container?.top || 0;

            const x = event.clientX - offsetX;
            const y = event.clientY - offsetY;

            const gdp = stateGDPMap[d.id] || "Data unavailable";
            setTooltipContent(`${d.properties.name} GDP: $${gdp}`);
            setTooltipPosition({ x: x + 15, y: y + 15 });
          })
          .on("mousemove", (event) => {
            const container = svgRef.current?.getBoundingClientRect();
            const offsetX = container?.left || 0;
            const offsetY = container?.top || 0;

            const x = event.clientX - offsetX;
            const y = event.clientY - offsetY;

            setTooltipPosition({ x: x + 15, y: y + 15 });
          })
          .on("mouseout", () => {
            setTooltipContent(null);
          });
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const drawCounties = async (stateId: string) => {
      setIsCountyLoading(true);

      try {
        const stateCounties = countiesData.features.filter((county) =>
          county.id.startsWith(stateId)
        );

        const gdpMap: Record<string, number> = {};
        const countyFetchPromises = stateCounties.map(async (county) => {
          const normalizedCountyId = county.id.padStart(5, "0");
          try {
            const data = await fetchCountyData(normalizedCountyId);
            const allIndustryData = data?.find(
              (item) => item.Description === "All industry total"
            );
            const gdp = allIndustryData?.["2023"] || 0;
            gdpMap[county.id] = gdp;
          } catch (error) {
            console.error(`Error fetching GDP for county ${county.id}:`, error);
            gdpMap[county.id] = 0;
          }
        });

        await Promise.all(countyFetchPromises);

        const minGDP = Math.min(...Object.values(gdpMap));
        const maxGDP = Math.max(...Object.values(gdpMap));
        const colorScale = d3
          .scaleLinear<string>()
          .domain([minGDP, minGDP + (maxGDP - minGDP) * 0.2, maxGDP])
          .range(["#ffe6e6", "#ff9999", "#cc0000"]);

        g.selectAll(".county")
          .data(stateCounties)
          .join("path")
          .attr("class", "county")
          .attr("d", path)
          .attr("fill", (d) => colorScale(gdpMap[d.id] || 0))
          .attr("stroke", "#000")
          .attr("stroke-width", 0.1)
          .on("mouseover", (event, d) => {
            const container = svgRef.current?.getBoundingClientRect();
            const offsetX = container?.left || 0;
            const offsetY = container?.top || 0;

            const x = event.clientX - offsetX;
            const y = event.clientY - offsetY;

            const gdp = gdpMap[d.id] || "Data unavailable";
            setTooltipContent(`${d.properties.name} GDP: $${gdp}`);
            setTooltipPosition({ x: x + 15, y: y + 15 });
          })
          .on("mousemove", (event) => {
            const container = svgRef.current?.getBoundingClientRect();
            const offsetX = container?.left || 0;
            const offsetY = container?.top || 0;

            const x = event.clientX - offsetX;
            const y = event.clientY - offsetY;

            setTooltipPosition({ x: x + 15, y: y + 15 });
          })
          .on("mouseout", () => {
            setTooltipContent(null);
          });
      } catch (error) {
        console.error("Error fetching counties:", error);
      } finally {
        setIsCountyLoading(false);
      }
    };

    const zoomToState = (feature, path) => {
      const [[x0, y0], [x1, y1]] = path.bounds(feature);
      const dx = x1 - x0;
      const dy = y1 - y0;
      const x = (x0 + x1) / 2;
      const y = (y0 + y1) / 2;
      const scale = Math.max(
        1,
        Math.min(8, 0.9 / Math.max(dx / 1280, dy / 720))
      );
      const translate = [1280 / 2 - scale * x, 720 / 2 - scale * y];

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

  return (
    <div className='relative w-[80%] h-[80%] mx-auto'>
      {(isLoading || isCountyLoading) && (
        <div className='absolute inset-0 flex justify-center items-center bg-white/75 z-10'>
          <div className='w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin'></div>
        </div>
      )}
      <svg ref={svgRef} className='w-full h-full border border-black'>
        <g ref={gRef}></g>
      </svg>
      {tooltipContent && (
        <Tooltip
          content={tooltipContent}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        />
      )}
      <footer className='text-center mt-4 flex justify-center items-center space-x-2'>
        <span className='text-gray-600 text-sm'>
          Economic data provided by the{" "}
          <a
            href='https://www.bea.gov'
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-500 underline'
          >
            U.S. Bureau of Economic Analysis
          </a>
        </span>
        <a href='https://www.bea.gov' target='_blank' rel='noopener noreferrer'>
          <img
            src='https://i.imgur.com/SCRJKfm.png'
            alt='U.S. Bureau of Economic Analysis'
            className='inline-block h-8'
          />
        </a>
      </footer>
    </div>
  );
};

export default Map;
