"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getGeoData } from "../utilities/geoData";
import Tooltip from "./Tooltip";
import { fetchStateData, fetchCountyData } from "../utilities/dataFetchers";
import PieChart from "./PieChart";

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
  const [stateInfo, setStateInfo] = useState<{
    name: string;
    gdp: string;
  } | null>(null);
  const [showPieChart, setShowPieChart] = useState(false);
  const [pieChartData, setPieChartData] = useState(null);

  const renderPieChart = async (stateInfo) => {
    try {
      const stateId = currentStateId?.padStart(2, "0") + "000";
      const data = await fetchStateData(stateId);

      const excludedCategories = [
        "Private services-providing industries 3",
        "Private goods-producing industries 2",
        "Natural resources and mining",
        "Trade",
        "Transportation and utilities",
        "Manufacturing and information",
        "Addenda:",
        "  Private industries",
      ];

      const chartData = data
        .filter(
          (item) =>
            item.Description !== "All industry total" &&
            !excludedCategories.includes(item.Description)
        )
        .map((item) => ({
          label: item.Description,
          value: parseInt(item["2023"]),
        }));

      setPieChartData(chartData);
      setShowPieChart(true);
    } catch (error) {
      console.error("Error rendering pie chart:", error);
    }
  };

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
          .on("click", async (event, d) => {
            const stateId = d.id as string;
            setCurrentStateId(stateId);
            setIsLoading(true);
            zoomToState(d, path);

            try {
              const stateName = d.properties.name || "Unknown State";
              const gdp = stateGDPMap[stateId] || "Data unavailable";
              const data = await fetchStateData(
                stateId.padStart(2, "0") + "000"
              );
              const excludedCategories = [
                "Private services-providing industries 3",
                "Private goods-producing industries 2",
                "Natural resources and mining",
                "Trade",
                "Transportation and utilities",
                "Manufacturing and information",
                "Addenda:",
                "  Private industries",
              ];
              const industryData = data.filter(
                (item) =>
                  item.Description !== "All industry total" &&
                  !excludedCategories.includes(item.Description)
              );

              const topIndustry = industryData.reduce((prev, current) =>
                parseInt(prev["2023"]) > parseInt(current["2023"])
                  ? prev
                  : current
              );
              await drawCounties(stateId);
              setStateInfo({
                name: stateName,
                gdp: gdp.toLocaleString(),
                topIndustry: topIndustry?.Description || "Data unavailable",
              });
            } catch (error) {
              console.error("Error fetching state or county data:", error);
            } finally {
              setIsLoading(false);
            }

            g.selectAll(".state").classed(
              "state-darkened",
              (state) => state.id !== stateId
            );
          })
          .on("mouseover", (event, d) => {
            d3.select(event.target)
              .transition()
              .duration(200)
              .attr("stroke-width", 2);

            const container = svgRef.current?.getBoundingClientRect();
            const offsetX = container?.left || 0;
            const offsetY = container?.top || 0;

            const x = event.clientX - offsetX;
            const y = event.clientY - offsetY;

            const gdp = stateGDPMap[d.id]
              ? stateGDPMap[d.id].toLocaleString()
              : "Data unavailable";

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
          .on("mouseout", (event) => {
            d3.select(event.target)
              .transition()
              .duration(200)
              .attr("stroke-width", 0.3);
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
            d3.select(event.target)
              .transition()
              .duration(200)
              .attr("stroke-width", 0.7);

            const container = svgRef.current?.getBoundingClientRect();
            const offsetX = container?.left || 0;
            const offsetY = container?.top || 0;

            const x = event.clientX - offsetX;
            const y = event.clientY - offsetY;

            const gdp = gdpMap[d.id]
              ? gdpMap[d.id].toLocaleString()
              : "Data unavailable";

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
          .on("mouseout", (event) => {
            d3.select(event.target)
              .transition()
              .duration(200)
              .attr("stroke-width", 0.1);
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
      setStateInfo(null);
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      g.selectAll(".county").remove();
      g.selectAll(".state").classed("state-darkened", false);
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
      {stateInfo && (
        <div className='absolute top-4 left-4 bg-white shadow-lg rounded-lg p-4 border border-gray-300'>
          <h2 className='text-lg font-bold'>{stateInfo.name}</h2>
          <p
            className='text-sm cursor-pointer text-blue-500 hover:underline'
            onClick={() => renderPieChart(stateInfo)}
          >
            GDP: ${stateInfo.gdp}
          </p>
          <p className='text-sm'>Top Industry: {stateInfo.topIndustry}</p>
        </div>
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
        {showPieChart && pieChartData && (
          <div
            className='absolute inset-0 bg-white/90 flex justify-center items-center z-50'
            onClick={() => setShowPieChart(false)}
          >
            <div
              className='relative bg-white p-4 rounded-lg shadow-lg'
              onClick={(e) => e.stopPropagation()}
            >
              <PieChart data={pieChartData} />
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default Map;
