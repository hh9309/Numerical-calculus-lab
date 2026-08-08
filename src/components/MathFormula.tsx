import React, { useEffect, useRef } from "react";
import katex from "katex";

interface MathFormulaProps {
  latex: string;
  block?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({ latex, block = false, className = "" }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(latex, containerRef.current, {
          displayMode: block,
          throwOnError: false,
        });
      } catch (err) {
        if (containerRef.current) {
          containerRef.current.textContent = latex;
        }
      }
    }
  }, [latex, block]);

  return (
    <span
      ref={containerRef}
      className={`font-serif ${block ? "my-2 block text-center overflow-x-auto py-1" : "inline-block px-1"} ${className}`}
    />
  );
};
