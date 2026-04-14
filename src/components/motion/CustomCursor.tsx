"use client";

import { useEffect, useState } from "react";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only mount on desktop sizes
    if (window.innerWidth <= 768) return;
    setIsVisible(true);

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Attach hover effects to buttons and links
    const interactiveElements = document.querySelectorAll("a, button, input");
    
    const mouseOver = () => setIsPointer(true);
    const mouseOut = () => setIsPointer(false);

    interactiveElements.forEach((el) => {
      el.addEventListener("mouseover", mouseOver);
      el.addEventListener("mouseout", mouseOut);
    });

    return () => {
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseover", mouseOver);
        el.removeEventListener("mouseout", mouseOut);
      });
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <div
        className={`pointer-events-none fixed z-[9999] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen transition-all duration-300 ease-out ${
          isPointer ? "scale-[2.5] bg-amber-400/30 blur-[2px]" : "bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          willChange: "transform",
        }}
      />
      <div
        className={`pointer-events-none fixed z-[9998] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen transition-all duration-700 ease-out ${
          isPointer ? "bg-amber-500/10 scale-150 blur-xl" : "bg-cyan-500/20 blur-2xl"
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          willChange: "transform",
        }}
      />
    </>
  );
}
