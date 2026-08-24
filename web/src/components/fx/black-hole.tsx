"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import * as THREE from "three";

export type BlackHoleProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: ReactNode;
  speed?: number;
  zoom?: number;
  particleCount?: number;
  orbSize?: number;
  glow?: number;
  contrast?: number;
  mirrorSplits?: number;
  warpEnabled?: boolean;
  distanceFade?: number;
  colorShiftR?: number;
  colorShiftG?: number;
  colorShiftB?: number;
  colorSpeed?: number;
  backgroundColor?: string;
  opacity?: number;
  cursorInteraction?: boolean;
  cursorIntensity?: number;
};

const vertexShader = /* glsl */ `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uSpeed;
uniform float uZoom;
uniform float uOrbSize;
uniform float uGlow;
uniform float uContrast;
uniform float uMirrorSplits;
uniform float uWarp;
uniform float uDistanceFade;
uniform float uColorShiftR;
uniform float uColorShiftG;
uniform float uColorShiftB;
uniform float uColorSpeed;
uniform float uOpacity;
uniform float uCursorIntensity;
uniform int uParticleCount;
uniform vec2 uResolution;
uniform vec2 uCursor;
uniform vec3 uBackground;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec3 cycleColor(float t, float seed) {
  float s = t * uColorSpeed + seed * 6.2831853;
  return 0.5 + 0.5 * cos(vec3(
    s + uColorShiftR,
    s + uColorShiftG + 2.094,
    s + uColorShiftB + 4.188
  ));
}

vec2 kaleido(vec2 p, float splits) {
  float a = atan(p.y, p.x);
  float r = length(p);
  float seg = 6.2831853 / max(splits, 1.0);
  a = mod(a, seg);
  a = abs(a - seg * 0.5);
  return vec2(cos(a), sin(a)) * r;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  uv /= max(uZoom, 0.01);

  vec2 cursor = uCursor * uCursorIntensity * 0.45;
  float pull = 1.0 / (1.0 + length(uv - cursor) * 2.5);
  uv -= cursor * pull * 0.35;

  if (uWarp > 0.5) {
    uv = kaleido(uv, uMirrorSplits);
  }

  float t = uTime * uSpeed;
  vec3 col = uBackground;
  float energy = 0.0;

  for (int i = 0; i < 30; i++) {
    if (i >= uParticleCount) break;
    float fi = float(i);
    float seed = hash(fi + 1.7);
    float orbit = 0.18 + seed * 0.55;
    float ang = t * (0.35 + seed * 0.85) * (mod(fi, 2.0) < 1.0 ? 1.0 : -1.0)
      + fi * 0.7
      + seed * 6.2831853;
    float wobble = 0.04 * sin(t * (1.2 + seed) + fi);
    vec2 pos = vec2(cos(ang), sin(ang)) * (orbit + wobble);

    // Mild gravitational warp toward singularity
    float distCenter = length(pos);
    pos *= 1.0 - 0.12 / (distCenter + 0.18);

    float d = length(uv - pos);
    float radius = uOrbSize * (0.045 + seed * 0.04);
    float g = uGlow * exp(-d * d / (radius * radius + 1e-5));
    vec3 c = cycleColor(t, seed);
    col += c * g * 1.35;
    energy += g;
  }

  // Event horizon / singularity
  float r = length(uv);
  float hole = smoothstep(0.14, 0.015, r);
  float disc = exp(-pow(abs(r - 0.18) * 6.5, 2.0)) * 0.7;
  col += disc * cycleColor(t * 0.5, 0.3);
  col *= 1.0 - hole * 0.95;
  col *= pow(max(energy + 0.22, 0.0), 1.0 / max(uContrast, 0.2));
  col += cycleColor(t * 0.25, 0.8) * exp(-r * 3.2) * 0.18;

  float fade = 1.0 - smoothstep(0.55, 1.15, r) * (1.0 - uDistanceFade);
  col *= fade;

  float alpha = clamp(max(col.r, max(col.g, col.b)) * uOpacity, 0.0, 1.0);
  gl_FragColor = vec4(col * uOpacity, alpha);
}
`;

function toCssSize(value: string | number | undefined, fallback: string): string {
  if (value === undefined) return fallback;
  return typeof value === "number" ? `${value}px` : value;
}

function hexToRgb(hex: string): THREE.Color {
  try {
    return new THREE.Color(hex);
  } catch {
    return new THREE.Color("#000000");
  }
}

/**
 * Gravitational particle field with color cycling.
 * API aligned with React Bits Pro "Black Hole" so it can be swapped for the
 * licensed CLI install when REACTBITS_LICENSE_KEY is available.
 */
export function BlackHole({
  width = "100%",
  height = "100%",
  className = "",
  children,
  speed = 1,
  zoom = 1.8,
  particleCount = 13,
  orbSize = 0.75,
  glow = 0.08,
  contrast = 3,
  mirrorSplits = 2,
  warpEnabled = true,
  distanceFade = 0.35,
  colorShiftR = -6,
  colorShiftG = -6,
  colorShiftB = -6,
  colorSpeed = 0.2,
  backgroundColor = "#000000",
  opacity = 1,
  cursorInteraction = false,
  cursorIntensity = 1,
}: BlackHoleProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({
    speed,
    zoom,
    particleCount,
    orbSize,
    glow,
    contrast,
    mirrorSplits,
    warpEnabled,
    distanceFade,
    colorShiftR,
    colorShiftG,
    colorShiftB,
    colorSpeed,
    backgroundColor,
    opacity,
    cursorInteraction,
    cursorIntensity,
  });
  const mouseRef = useRef([0, 0]);
  const smoothMouseRef = useRef([0, 0]);

  propsRef.current = {
    speed,
    zoom,
    particleCount,
    orbSize,
    glow,
    contrast,
    mirrorSplits,
    warpEnabled,
    distanceFade,
    colorShiftR,
    colorShiftG,
    colorShiftB,
    colorSpeed,
    backgroundColor,
    opacity,
    cursorInteraction,
    cursorIntensity,
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 1 },
      uZoom: { value: 1.8 },
      uOrbSize: { value: 0.75 },
      uGlow: { value: 0.08 },
      uContrast: { value: 3 },
      uMirrorSplits: { value: 2 },
      uWarp: { value: 1 },
      uDistanceFade: { value: 0.35 },
      uColorShiftR: { value: -6 },
      uColorShiftG: { value: -6 },
      uColorShiftB: { value: -6 },
      uColorSpeed: { value: 0.2 },
      uOpacity: { value: 1 },
      uCursorIntensity: { value: 0 },
      uParticleCount: { value: 13 },
      uResolution: { value: new THREE.Vector2() },
      uCursor: { value: new THREE.Vector2() },
      uBackground: { value: new THREE.Color("#000000") },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(quad);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(dpr);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onMouseMove = (e: MouseEvent) => {
      if (!propsRef.current.cursorInteraction) return;
      const rect = mount.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      mouseRef.current[0] = (e.clientX - rect.left) / rect.width - 0.5;
      mouseRef.current[1] = -((e.clientY - rect.top) / rect.height - 0.5);
    };
    const onMouseLeave = () => {
      mouseRef.current[0] = 0;
      mouseRef.current[1] = 0;
    };
    // Listen on window so overlays (glass cards) don't block gravitational pull
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    let frameId = 0;
    let isVisible = false;
    let isPageVisible = !document.hidden;
    let elapsed = 0;
    let lastT = 0;

    const animate = (t: number) => {
      frameId = requestAnimationFrame(animate);
      const p = propsRef.current;
      const dt = lastT === 0 ? 0 : Math.min(t - lastT, 100);
      lastT = t;
      elapsed += dt * 0.001;

      smoothMouseRef.current[0] +=
        (mouseRef.current[0] - smoothMouseRef.current[0]) * 0.08;
      smoothMouseRef.current[1] +=
        (mouseRef.current[1] - smoothMouseRef.current[1]) * 0.08;

      uniforms.uTime.value = elapsed;
      uniforms.uSpeed.value = p.speed;
      uniforms.uZoom.value = p.zoom;
      uniforms.uOrbSize.value = p.orbSize;
      uniforms.uGlow.value = p.glow * 18;
      uniforms.uContrast.value = p.contrast;
      uniforms.uMirrorSplits.value = p.mirrorSplits;
      uniforms.uWarp.value = p.warpEnabled ? 1 : 0;
      uniforms.uDistanceFade.value = p.distanceFade;
      uniforms.uColorShiftR.value = p.colorShiftR;
      uniforms.uColorShiftG.value = p.colorShiftG;
      uniforms.uColorShiftB.value = p.colorShiftB;
      uniforms.uColorSpeed.value = p.colorSpeed;
      uniforms.uOpacity.value = p.opacity;
      uniforms.uCursorIntensity.value = p.cursorInteraction
        ? p.cursorIntensity
        : 0;
      uniforms.uParticleCount.value = Math.max(
        1,
        Math.min(30, Math.round(p.particleCount)),
      );
      uniforms.uCursor.value.set(
        smoothMouseRef.current[0],
        smoothMouseRef.current[1],
      );
      uniforms.uBackground.value.copy(hexToRgb(p.backgroundColor));

      renderer.render(scene, camera);
    };

    const tryStart = () => {
      if (isVisible && isPageVisible && frameId === 0) {
        lastT = 0;
        frameId = requestAnimationFrame(animate);
      }
    };
    const tryStop = () => {
      if (frameId !== 0) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        isVisible ? tryStart() : tryStop();
      },
      { threshold: 0 },
    );
    io.observe(mount);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      isPageVisible ? tryStart() : tryStop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    tryStart();

    return () => {
      tryStop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
    };
  }, []);

  const style: CSSProperties = {
    width: toCssSize(width, "100%"),
    height: toCssSize(height, "100%"),
    position: "relative",
    overflow: "hidden",
  };

  return (
    <div className={className} style={style}>
      <div
        ref={mountRef}
        aria-hidden
        className="absolute inset-0"
        style={{
          pointerEvents: cursorInteraction ? "auto" : "none",
        }}
      />
      {children ? (
        <div className="relative z-10 h-full w-full">{children}</div>
      ) : null}
    </div>
  );
}

export default BlackHole;
