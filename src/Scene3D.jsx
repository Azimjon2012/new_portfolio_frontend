import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef } from "react";

function Stars() {
  const ref = useRef();

  useFrame((state) => {
    ref.current.rotation.y += 0.0005;
    ref.current.rotation.x += 0.0003;
  });

  const positions = new Float32Array(5000 * 3).map(
    () => (Math.random() - 0.5) * 10
  );

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial size={0.02} color="#a78bfa" />
    </Points>
  );
}

export default function Scene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} intensity={2} color="#8b5cf6" />
      <Stars />
    </Canvas>
  );
}