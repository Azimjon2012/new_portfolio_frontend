import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function ShaderPlane() {
  const ref = useRef();

  useFrame((state) => {
    ref.current.material.uniforms.uTime.value =
      state.clock.elapsedTime;
  });

  return (
    <mesh ref={ref} scale={[10, 10, 1]}>
      <planeGeometry />
      <shaderMaterial
        uniforms={{
          uTime: { value: 0 },
        }}
        fragmentShader={`
          uniform float uTime;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;

            float wave = sin(uv.x * 10.0 + uTime) * 0.1;
            uv.y += wave;

            vec3 color = vec3(
              0.1 + uv.x * 0.2,
              0.05,
              0.2 + uv.y * 0.3
            );

            gl_FragColor = vec4(color, 1.0);
          }
        `}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
      />
    </mesh>
  );
}

export default function ShaderBackground() {
  return (
    <Canvas className="absolute inset-0 -z-30">
      <ShaderPlane />
    </Canvas>
  );
}