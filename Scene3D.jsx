import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function WavePlane() {
  const mesh = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    mesh.current.material.uniforms.uTime.value = t;
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <shaderMaterial
        transparent
        uniforms={{
          uTime: { value: 0 },
        }}
        vertexShader={`
          varying vec2 vUv;
          uniform float uTime;

          void main() {
            vUv = uv;
            vec3 pos = position;

            float wave = sin(pos.x * 2.0 + uTime) * 0.2;
            wave += cos(pos.y * 2.0 + uTime * 1.5) * 0.2;

            pos.z += wave;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;

          void main() {
            float glow = 0.5 + 0.5 * sin(uTime + vUv.x * 3.0);

            vec3 color = mix(
              vec3(0.1, 0.05, 0.2),
              vec3(0.4, 0.2, 0.8),
              glow
            );

            gl_FragColor = vec4(color, 0.35);
          }
        `}
      />
    </mesh>
  );
}

function FloatingLight() {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    ref.current.position.x = Math.sin(t) * 2;
    ref.current.position.y = Math.cos(t * 0.7) * 1.5;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshStandardMaterial emissive="#8b5cf6" emissiveIntensity={2} />
    </mesh>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 2, 6] }}
      style={{ pointerEvents: "none" }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 3, 2]} intensity={2} color="#8b5cf6" />

      <WavePlane />
      <FloatingLight />
    </Canvas>
  );
}