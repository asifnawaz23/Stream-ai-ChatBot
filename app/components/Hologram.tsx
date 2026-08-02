"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Rotating holographic core: a wireframe icosahedron wrapped in a neon
 * torus-knot orbit, three glowing orbital rings, and drifting star particles.
 * Pure decorative layer — sits behind the chat and ignores pointer events.
 */

function Core() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.28;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.35;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.22;
  });

  return (
    <group ref={group}>
      {/* Wireframe core */}
      <mesh>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.4} />
      </mesh>
      {/* Neon orbit knot */}
      <mesh>
        <torusKnotGeometry args={[1.95, 0.07, 130, 18]} />
        <meshBasicMaterial color="#e879f9" wireframe transparent opacity={0.28} />
      </mesh>
      {/* Orbital rings on different axes */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.6, 0.011, 8, 140]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 2.6, 0.5, 0]}>
        <torusGeometry args={[3.05, 0.008, 8, 140]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[0.5, 1.1, 0.3]}>
        <torusGeometry args={[3.5, 0.006, 8, 140]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Particles() {
  const points = useRef<THREE.Points>(null);
  const { geometry } = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 14;
      positions[i + 2] = (Math.random() - 0.5) * 14;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry };
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color="#67e8f9"
        size={0.02}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

export default function Hologram() {
  const hasWebGL =
    typeof window !== "undefined" &&
    typeof window.WebGLRenderingContext !== "undefined";

  if (!hasWebGL) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 opacity-70">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 55 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.25} />
        <pointLight position={[5, 5, 5]} intensity={40} color="#22d3ee" />
        <pointLight position={[-5, -3, 3]} intensity={28} color="#e879f9" />
        <Core />
        <Particles />
      </Canvas>
    </div>
  );
}
