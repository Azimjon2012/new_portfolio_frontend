import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function WavePlane() {
  const mesh = useRef();

  useFrame((state) => {
    mesh.current.material.uniforms.uTime.value =
      state.clock.getElapsedTime();
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} ref={mesh}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <shaderMaterial
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`
          varying vec2 vUv;
          uniform float uTime;
          void main(){
            vUv = uv;
            vec3 pos = position;
            pos.z += sin(pos.x*2.0+uTime)*0.2;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;
          void main(){
            float glow = 0.5 + 0.5*sin(uTime+vUv.x*3.0);
            vec3 color = mix(vec3(0.05,0.02,0.1), vec3(0.6,0.3,1.0), glow);
            gl_FragColor = vec4(color,0.4);
          }
        `}
        transparent
      />
    </mesh>
  );
}

export default function Scene3D() {
  return (
    <Canvas style={{ pointerEvents: "none" }}>
      <ambientLight intensity={0.5} />
      <WavePlane />
    </Canvas>
  );
}