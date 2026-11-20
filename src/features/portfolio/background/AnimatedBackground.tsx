import { useEffect, useRef } from "react";
import "./AnimatedBackground.css";

type Star = {
  x: number;
  y: number;
  z: number;
  size: number;
  tone: number;
};

/** Star pool. The drawn count is scaled to the viewport on every resize. */
const stars: Star[] = Array.from({ length: 240 }, (_, i) => ({
  x: ((i * 73) % 1000) / 1000,
  y: ((i * 151) % 1000) / 1000,
  z: ((i * 97) % 1000) / 1000,
  size: 0.55 + (i % 5) * 0.28,
  tone: i % 3,
}));

/** Backing-store ceiling so 4K/retina screens never allocate huge buffers. */
const MAX_BACKING_PIXELS = 6_500_000;

/** Heuristic for low-end phones/tablets: few cores or little memory. */
const isLowEndDevice = () => {
  const cores = navigator.hardwareConcurrency || 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8;
  return cores <= 4 || memory <= 4;
};

/**
 * The canvas measures its own layout box instead of `window.innerWidth`/
 * `innerHeight`, so it tracks the real viewport on every device: mobile
 * address-bar collapse, rotation, pinch-zoom and browser chrome all covered.
 * Detail tiers, star density and pixel ratio then adapt to the measured size.
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

    // Scenery (horizon glow, orbit rings, HUD panels) never moves, so it is
    // rasterised once per resize and blitted each frame instead of re-stroked.
    const sceneryCanvas = document.createElement("canvas");
    const sceneryContext = sceneryCanvas.getContext("2d");

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let lastPaint = 0;
    let resizeQueued = false;
    let hasSceneryLayer = false;
    /** 0 = phone / short landscape, 1 = tablet or tight window, 2 = desktop. */
    let detail = 2;
    let starCount = stars.length;

    // ---------------------------------------------------------- device tiers
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

    const fitStarCount = () => {
      const density = Math.round((width * height) / 13_500);
      const floor = detail === 0 ? 56 : 84;
      const ceiling = detail === 0 ? (lowEnd ? 64 : 90) : lowEnd ? 140 : stars.length;
      starCount = Math.min(stars.length, Math.max(floor, density), ceiling);
    };

    // ------------------------------------------------------------ static art
    const paintNebula = (ctx: CanvasRenderingContext2D) => {
      const radius = Math.max(width * 0.72, Math.hypot(width, height) * 0.5);
      const nebula = ctx.createRadialGradient(width * 0.58, height * 0.38, 0, width * 0.58, height * 0.38, radius);
      nebula.addColorStop(0, "rgba(24, 95, 255, 0.16)");
      nebula.addColorStop(0.24, "rgba(0, 223, 255, 0.07)");
      nebula.addColorStop(0.56, "rgba(73, 37, 152, 0.08)");
      nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);
    };

    const drawHudPanel = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      panelWidth: number,
      panelHeight: number,
      alpha: number
    ) => {
      ctx.strokeStyle = `rgba(0, 226, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 18, y);
      ctx.lineTo(x + panelWidth, y);
      ctx.lineTo(x + panelWidth, y + panelHeight - 16);
      ctx.lineTo(x + panelWidth - 16, y + panelHeight);
      ctx.lineTo(x, y + panelHeight);
      ctx.lineTo(x, y + 18);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 210, 255, ${alpha * 0.22})`;
      for (let i = 0; i < 5; i += 1) {
        ctx.fillRect(x + 18 + i * 20, y + 18, 8, 3);
      }
    };

    /** Everything that does not animate: glow, rings, beam and HUD panels. */
    const paintScenery = (ctx: CanvasRenderingContext2D) => {
      const glowRadius = Math.max(Math.min(width, height) * 0.7, Math.hypot(width, height) * 0.42);
      const horizonGlow = ctx.createRadialGradient(width * 0.72, height * 0.32, 0, width * 0.72, height * 0.32, glowRadius);
      horizonGlow.addColorStop(0, "rgba(0, 174, 255, 0.14)");
      horizonGlow.addColorStop(0.42, "rgba(0, 174, 255, 0.055)");
      horizonGlow.addColorStop(1, "rgba(0, 174, 255, 0)");
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, 0, width, height);

      const horizonRadius = Math.min(width, height) * (detail === 0 ? 0.58 : 0.72);
      const horizonX = width * (detail === 0 ? 1.08 : 1.02);
      const horizonY = height * (detail === 0 ? 0.22 : 0.28);

      ctx.strokeStyle = "rgba(180, 245, 255, 0.34)";
      ctx.lineWidth = detail === 0 ? 1 : 1.5;
      ctx.beginPath();
      ctx.arc(horizonX, horizonY, horizonRadius, Math.PI * 0.72, Math.PI * 1.35);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0, 210, 255, 0.13)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.ellipse(
          width * 0.72,
          height * (detail === 0 ? 0.35 : 0.42),
          Math.min(width, height) * (0.34 + i * 0.11),
          Math.min(width, height) * (0.08 + i * 0.018),
          -0.35,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      const ringX = width * (detail === 0 ? 0.78 : 0.8);
      const ringY = height * (detail === 0 ? 0.82 : 0.78);
      const ringRadius = Math.min(width, height) * (detail === 0 ? 0.16 : 0.22);
      for (let i = 0; i < 8; i += 1) {
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.18 - i * 0.015})`;
        ctx.lineWidth = i === 1 ? 2 : 1;
        ctx.beginPath();
        ctx.ellipse(ringX, ringY, ringRadius * (0.38 + i * 0.12), ringRadius * (0.08 + i * 0.025), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      const beam = ctx.createLinearGradient(ringX, ringY - ringRadius * 1.4, ringX, ringY + 8);
      beam.addColorStop(0, "rgba(0, 221, 255, 0)");
      beam.addColorStop(0.62, "rgba(0, 221, 255, 0.14)");
      beam.addColorStop(1, "rgba(0, 221, 255, 0.34)");
      ctx.fillStyle = beam;
      ctx.fillRect(ringX - 2, ringY - ringRadius * 1.4, 4, ringRadius * 1.42);

      // The narrow third panel needs >=120px to fit its status dots, so it is
      // desktop-only; tablets keep the two wide panels.
      if (detail >= 1) {
        drawHudPanel(ctx, width * 0.055, height * 0.15, width * 0.22, height * 0.2, 0.23);
        drawHudPanel(ctx, width * 0.06, height * 0.67, width * 0.2, height * 0.17, 0.19);
        if (detail >= 2) drawHudPanel(ctx, width * 0.84, height * 0.25, width * 0.1, height * 0.26, 0.14);
      }
    };

    const paintRain = (ctx: CanvasRenderingContext2D, time: number) => {
      ctx.fillStyle = "rgba(0, 229, 255, 0.14)";
      for (let i = 0; i < 35; i += 1) {
        const x = width * 0.55 + ((i * 29) % 340);
        const y = ((i * 83 + time * 0.012) % height) - 50;
        ctx.fillRect(x, y, 1, 18 + (i % 5) * 12);
      }
    };

    // ---------------------------------------------------------------- frames
    const renderFrame = (time: number) => {
      context.clearRect(0, 0, width, height);
      paintNebula(context);

      const pulse = reducedMotion ? 0 : Math.sin(time * 0.0014) * 0.5 + 0.5;
      const starScale = detail === 0 ? 0.85 : 1;

      for (let i = 0; i < starCount; i += 1) {
        const star = stars[i];
        const drift = reducedMotion ? 0 : time * 0.000018 * (0.25 + star.z);
        const x = ((star.x + drift) % 1) * width;
        const y = star.y * height;
        const opacity = 0.2 + star.z * 0.54 + pulse * 0.08;
        const color = star.tone === 0 ? "180, 245, 255" : star.tone === 1 ? "0, 184, 255" : "114, 90, 255";

        context.fillStyle = `rgba(${color}, ${opacity})`;
        context.beginPath();
        context.arc(x, y, star.size * starScale * (0.75 + star.z), 0, Math.PI * 2);
        context.fill();
      }

      if (hasSceneryLayer) context.drawImage(sceneryCanvas, 0, 0, width, height);
      else paintScenery(context);

      if (detail >= 1) paintRain(context, time);
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

    // --------------------------------------------------------------- sizing
    const paintSceneryLayer = () => {
      hasSceneryLayer = false;
      if (!sceneryContext || canvas.width < 1 || canvas.height < 1) return;
      sceneryCanvas.width = canvas.width;
      sceneryCanvas.height = canvas.height;
      sceneryContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      paintScenery(sceneryContext);
      hasSceneryLayer = true;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width) || window.innerWidth);
      height = Math.max(1, Math.round(rect.height) || window.innerHeight);

      classify();
      fitPixelRatio();

      canvas.width = Math.max(1, Math.floor(width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      fitStarCount();
      paintSceneryLayer();
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

    // ------------------------------------------------------------- listeners
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
      <div className="background-scanlines" />
      <div className="background-vignette" />
    </div>
  );
}
