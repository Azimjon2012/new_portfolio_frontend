import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function ShaderPlane() {
  const ref = useRef();

  useFrame((state) => {
    ref.current.material.uniforms.uTime.value =
      state.clock.elapsedTime;
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[10, 10]} />
      <shaderMaterial
        uniforms={{ uTime: { value: 0 } }}
        fragmentShader={`
          uniform float uTime;
          varying vec2 vUv;

          float noise(vec2 p){
            return sin(p.x)*sin(p.y);
          }

          void main(){
            vec2 uv = vUv;

            float n = noise(uv * 6.0 + uTime * 0.4);

            vec3 col = mix(
              vec3(0.05,0.0,0.15),
              vec3(0.2,0.0,0.4),
              n
            );

            gl_FragColor = vec4(col,1.0);
          }
        `}
        vertexShader={`
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `}
      />
    </mesh>
  );
}

export default function ShaderBackground() {
  return (
    <Canvas className="absolute inset-0 -z-20">
      <ShaderPlane />
    </Canvas>
  );
}