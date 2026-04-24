import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef } from "react";

function Stars() {
  const ref = useRef();

  useFrame(() => {
    ref.current.rotation.y += 0.0003;
  });

  const positions = new Float32Array(1500 * 3).map(
    () => (Math.random() - 0.5) * 8
  );

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial size={0.015} color="#a78bfa" transparent opacity={0.7} />
    </Points>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5] }}
      style={{ pointerEvents: "none" }}
      dpr={[1, 1.5]}   // 🔥 фикс лагов
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 2, 2]} intensity={1.2} />
      <Stars />
    </Canvas>
  );
}