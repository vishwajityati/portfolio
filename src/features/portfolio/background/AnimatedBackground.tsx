"use client";
import { useEffect, useRef } from "react";
import "./AnimatedBackground.css";

type NetworkNode = {
  x: number;
  y: number;
  z: number;
  size: number;
  phase: number;
};

type ProjectedNode = {
  x: number;
  y: number;
  z: number;
  scale: number;
  size: number;
  phase: number;
};

const TAU = Math.PI * 2;
const MAX_NODES = 140;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Vogel spiral fills a disc evenly, so the field covers the whole viewport —
 * including the corners — at every angle of the slow rotation.
 */
const nodes: NetworkNode[] = Array.from({ length: MAX_NODES }, (_, i) => {
  const radius = Math.sqrt((i + 0.5) / MAX_NODES);
  const angle = i * GOLDEN_ANGLE;
  const z = (((i * 29) % 100) / 100) * 2 - 1;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z,
    size: 0.85 + (i % 4) * 0.15,
    phase: ((i * 53) % 100) / 100,
  };
});

/** Backing-store ceiling so 4K/retina screens never allocate huge buffers. */
const MAX_BACKING_PIXELS = 6_500_000;

/** Heuristic for low-end phones/tablets: few cores or little memory. */
const isLowEndDevice = () => {
  const cores = navigator.hardwareConcurrency || 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8;
  return cores <= 4 || memory <= 4;
};

/**
 * A slowly rotating network of green dots spread across every page. Every dot
 * is joined to every other dot with very faint lines, and light pulses drift
 * along the connections. Motion stops for reduced-motion users and hidden tabs.
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lowEnd = isLowEndDevice();
    let reducedMotion = motionQuery.matches;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let lastPaint = 0;
    let resizeQueued = false;
    /** 0 = phone / short landscape, 1 = tablet or tight window, 2 = desktop. */
    let detail = 2;
    let nodeCount = nodes.length;

    const classify = () => {
      if (width < 768 || height < 560) detail = 0;
      else if (width < 1200) detail = 1;
      else detail = 2;
    };

    const fitPixelRatio = () => {
      const cap = lowEnd ? 1.25 : detail === 0 ? 1.5 : 2;
      let ratio = Math.min(window.devicePixelRatio || 1, cap);
      const area = width * height;
      if (area * ratio * ratio > MAX_BACKING_PIXELS) {
        ratio = Math.max(1, Math.sqrt(MAX_BACKING_PIXELS / area));
      }
      pixelRatio = ratio;
    };

    /** Dot density follows viewport area, with floors and ceilings per tier. */
    const fitNodeCount = () => {
      const density = Math.round((width * height) / 25_000);
      const floor = detail === 0 ? 28 : detail === 1 ? 40 : 56;
      const ceiling = detail === 0 ? (lowEnd ? 28 : 40) : detail === 1 ? (lowEnd ? 44 : 72) : lowEnd ? 64 : MAX_NODES;
      nodeCount = Math.max(floor, Math.min(density, ceiling));
    };

    const renderFrame = (time: number) => {
      context.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      // Radius reaches past the corners so no part of the page is left empty.
      const fieldRadius = Math.hypot(width, height) * 0.53;

      const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.75);
      glow.addColorStop(0, "rgba(24, 122, 82, 0.11)");
      glow.addColorStop(0.55, "rgba(16, 84, 62, 0.045)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      // Roughly one full turn every 4 minutes.
      const rotation = time * 0.000025;
      const cosRotation = Math.cos(rotation);
      const sinRotation = Math.sin(rotation);

      // Using only the first `nodeCount` spiral points would shrink the
      // field, so widen them back out to the viewport corners at any count.
      const coverage = Math.sqrt(MAX_NODES / nodeCount);
      const dotScale = Math.min(1.2, Math.max(0.8, Math.min(width, height) / 900));

      const projected: ProjectedNode[] = [];
      for (let i = 0; i < nodeCount; i += 1) {
        const node = nodes[i];
        projected.push({
          x: centerX + (node.x * cosRotation - node.y * sinRotation) * fieldRadius * coverage,
          y: centerY + (node.x * sinRotation + node.y * cosRotation) * fieldRadius * coverage,
          z: node.z,
          scale: 1 + node.z * 0.12,
          size: node.size,
          phase: node.phase,
        });
      }

      // Every dot connects to every other dot. Batching the lines into two
      // paths keeps the very faint mesh cheap to draw even with 140 dots.
      const backLines = new Path2D();
      const frontLines = new Path2D();
      for (let i = 0; i < projected.length; i += 1) {
        for (let j = i + 1; j < projected.length; j += 1) {
          const a = projected[i];
          const b = projected[j];
          const path = (a.z + b.z) >= 0 ? frontLines : backLines;
          path.moveTo(a.x, a.y);
          path.lineTo(b.x, b.y);
        }
      }
      context.lineWidth = 0.55 * dotScale;
      context.strokeStyle = "rgba(104, 255, 176, 0.008)";
      context.stroke(backLines);
      context.strokeStyle = "rgba(104, 255, 176, 0.016)";
      context.stroke(frontLines);

      // A few light packets drift along the connections, offset per pair so
      // the network never blinks all at once.
      const pulseStride = lowEnd ? 10 : Math.max(6, Math.round(nodeCount / 12));
      for (let i = 0; i < projected.length; i += 1) {
        const a = projected[i];
        for (let j = i + 1; j < projected.length; j += 1) {
          if ((i + j) % pulseStride !== 0) continue;
          const b = projected[j];
          const progress = (time * 0.00022 + a.phase + b.phase * 0.61) % 1;
          const depthLight = 0.65 + ((a.z + b.z) * 0.5 + 1) * 0.18;
          context.fillStyle = `rgba(190, 255, 220, ${0.1 * depthLight})`;
          context.beginPath();
          context.arc(a.x + (b.x - a.x) * progress, a.y + (b.y - a.y) * progress, 1.1 * dotScale, 0, TAU);
          context.fill();
        }
      }

      // Dots on top, brighter as they come toward the viewer.
      for (const dot of projected) {
        const front = (dot.z + 1) * 0.5;
        const twinkle = reducedMotion ? 1 : 0.82 + Math.sin(time * 0.0015 + dot.phase * TAU) * 0.18;
        const size = dot.size * dot.scale * dotScale * 1.8;

        context.fillStyle = `rgba(64, 255, 150, ${(0.05 + front * 0.06) * twinkle})`;
        context.beginPath();
        context.arc(dot.x, dot.y, size * 3.2, 0, TAU);
        context.fill();

        context.fillStyle = `rgba(70, 255, 158, ${(0.16 + front * 0.2) * twinkle})`;
        context.beginPath();
        context.arc(dot.x, dot.y, size * 1.8, 0, TAU);
        context.fill();

        context.fillStyle = `rgba(200, 255, 224, ${0.6 + front * 0.32})`;
        context.beginPath();
        context.arc(dot.x, dot.y, size * 0.7, 0, TAU);
        context.fill();
      }
    };

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      // Phones and low-end hardware cap at ~30fps: the motion is slow enough
      // to look identical while halving per-frame work and battery drain.
      const frameInterval = detail === 0 || lowEnd ? 32 : 0;
      if (frameInterval > 0 && time - lastPaint < frameInterval) return;
      lastPaint = time;
      renderFrame(time);
    };

    const start = () => {
      if (!frame && !reducedMotion && document.visibilityState === "visible") {
        lastPaint = 0;
        frame = requestAnimationFrame(draw);
      }
    };

    const stop = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width) || window.innerWidth);
      height = Math.max(1, Math.round(rect.height) || window.innerHeight);

      classify();
      fitPixelRatio();
      fitNodeCount();

      canvas.width = Math.max(1, Math.floor(width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      lastPaint = 0;
      if (reducedMotion) renderFrame(0);
    };

    /** Coalesces resize storms (URL-bar collapse, rotation) into one repaint. */
    const queueResize = () => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        resize();
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        queueResize();
        start();
      } else {
        stop();
      }
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stop();
        renderFrame(0);
      } else {
        start();
      }
    };

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(queueResize) : null;
    const visualViewport = window.visualViewport;

    resize();
    observer?.observe(canvas);
    window.addEventListener("resize", queueResize);
    window.addEventListener("orientationchange", queueResize);
    window.addEventListener("pageshow", queueResize);
    visualViewport?.addEventListener("resize", queueResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    motionQuery.addEventListener("change", onMotionChange);

    if (!reducedMotion) start();

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", queueResize);
      window.removeEventListener("orientationchange", queueResize);
      window.removeEventListener("pageshow", queueResize);
      visualViewport?.removeEventListener("resize", queueResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      motionQuery.removeEventListener("change", onMotionChange);
      stop();
    };
  }, []);

  return (
    <div className="portfolio-backdrop" aria-hidden="true">
      <canvas ref={canvasRef} className="space-planet-canvas" />
    </div>
  );
}
