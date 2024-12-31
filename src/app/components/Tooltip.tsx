type TooltipProps = {
  content: string;
  x: number;
  y: number;
};

const Tooltip = ({ content, x, y }: TooltipProps) => {
  return (
    <div
      className='absolute bg-white text-gray-800 shadow-md rounded-lg px-3 py-2 text-sm font-medium border border-gray-200'
      style={{
        top: `${y}px`,
        left: `${x}px`,
        transform: "translate(25px, 105px)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        zIndex: 10,
      }}
    >
      {content}
    </div>
  );
};

export default Tooltip;
