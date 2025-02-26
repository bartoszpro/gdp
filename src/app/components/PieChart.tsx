"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Tooltip from "./Tooltip";

interface PieChartProps {
  data: { label: string; value: number }[];
  onClose: () => void;
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const chartRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const newSize = Math.min(width, height, 500);
        setDimensions({ width: newSize, height: newSize });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const { width, height } = dimensions;
    const radius = Math.min(width, height) / 2;

    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<{ label: string; value: number }>().value((d) => d.value).sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const color = d3.scaleOrdinal().domain(data.map((d) => d.label)).range(d3.schemeTableau10);

    const chartContainer = chartRef.current?.getBoundingClientRect();

    g.selectAll("path")
      .data(pie(data))
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => (color(d.data.label) ?? "#ccc") as string)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .on("mouseover", (event, d) => {
        d3.select(event.target).style("opacity", 0.7).attr("stroke-width", 2);

        const percentage = ((d.data.value / d3.sum(data, (d) => d.value)) * 100).toFixed(1);

        const offsetX = chartContainer?.left || 0;
        const offsetY = chartContainer?.top || 0;

        const x = event.clientX - offsetX;
        const y = event.clientY - offsetY;

        setTooltipContent(`${d.data.label}: ${percentage}%`);
        setTooltipPosition({ x: x + 15, y: y + 15 });
      })
      .on("mousemove", (event) => {
        const offsetX = chartContainer?.left || 0;
        const offsetY = chartContainer?.top || 0;

        const x = event.clientX - offsetX;
        const y = event.clientY - offsetY;

        setTooltipPosition({ x: x + 15, y: y + 15 });
      })
      .on("mouseout", (event) => {
        d3.select(event.target).style("opacity", 1).attr("stroke-width", 0.5);
        setTooltipContent(null);
      });
  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="fixed inset-0 flex bg-white/90 justify-center items-center z-49">
      <div className="relative flex justify-center items-center w-[50%] h-[50%] max-w-[500px] max-h-[500px]">
        <svg ref={chartRef}></svg>
        {tooltipContent && <Tooltip content={tooltipContent} x={tooltipPosition.x} y={tooltipPosition.y} />}
      </div>
    </div>
  );
};

export default PieChart;
