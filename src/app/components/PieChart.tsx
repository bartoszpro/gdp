"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Tooltip from "./Tooltip";

interface PieChartProps {
  data: { label: string; value: number }[];
  onClose: () => void;
}

const PieChart: React.FC<PieChartProps> = ({ data, onClose }) => {
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  useEffect(() => {
    const width = 700;
    const height = 700;
    const radius = Math.min(width, height) / 2;

    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie<{ label: string; value: number }>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const color = d3
      .scaleOrdinal()
      .domain(data.map((d) => d.label))
      .range(d3.schemeTableau10);

    const chartContainer = chartRef.current?.getBoundingClientRect();

    g.selectAll("path")
      .data(pie(data))
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.label)!)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .on("mouseover", (event, d) => {
        d3.select(event.target).style("opacity", 0.7).attr("stroke-width", 2);

        const percentage = (
          (d.data.value / d3.sum(data, (d) => d.value)) *
          100
        ).toFixed(1);

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
  }, [data]);

  return (
    <div className='fixed inset-0 flex bg-white/90 justify-center items-center z-50'>
      <div className='relative flex justify-center items-center'>
        <svg ref={chartRef}></svg>
        {tooltipContent && (
          <Tooltip
            content={tooltipContent}
            x={tooltipPosition.x}
            y={tooltipPosition.y}
          />
        )}
      </div>
    </div>
  );
};

export default PieChart;
