import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef } from "react";

function FloatingBlobs() {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    ref.current.rotation.y = t * 0.1;
    ref.current.rotation.x = t * 0.05;

    ref.current.position.y = Math.sin(t * 0.5) * 0.3;
  });

  const positions = new Float32Array(3000 * 3).map(
    () => (Math.random() - 0.5) * 12
  );

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        size={0.025}
        color="#a78bfa"
        transparent
        opacity={0.8}
      />
    </Points>
  );
}

function GlowOrb() {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    ref.current.position.x = Math.sin(t * 0.8) * 2;
    ref.current.position.y = Math.cos(t * 0.6) * 1.5;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshStandardMaterial
        emissive="#8b5cf6"
        emissiveIntensity={2}
        color="#111"
      />
    </mesh>
  );
}

export default function Scene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 6] }}>
      <ambientLight intensity={0.4} />

      <pointLight position={[3, 3, 3]} intensity={2} color="#8b5cf6" />
      <pointLight position={[-3, -2, -2]} intensity={1.5} color="#3b82f6" />

      <FloatingBlobs />
      <GlowOrb />
    </Canvas>
  );
}