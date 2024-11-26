type TooltipProps = {
    content: string;
    x: number;
    y: number;
  };
  
  const Tooltip = ({ content, x, y }: TooltipProps) => {
    return (
      <div
        className="absolute bg-white border border-gray-300 p-2 rounded text-sm text-black"
        style={{
          top: `${y}px`,
          left: `${x}px`,
          pointerEvents: "none",
        }}
      >
        {content}
      </div>
    );
  };
  
  export default Tooltip;
  