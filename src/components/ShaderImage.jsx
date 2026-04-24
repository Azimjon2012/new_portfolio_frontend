import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ShaderImage({ texture, hover }) {
  const mesh = useRef();

  useFrame((state) => {
    if (!mesh.current) return;

    mesh.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    mesh.current.material.uniforms.uHover.value = hover.current;
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 1.2, 32, 32]} />
      <shaderMaterial
        uniforms={{
          uTime: { value: 0 },
          uHover: { value: 0 },
          uTexture: { value: texture },
        }}
        vertexShader={`
          varying vec2 vUv;
          uniform float uHover;
          uniform float uTime;

          void main() {
            vUv = uv;

            vec3 pos = position;

            float wave = sin(pos.x * 5.0 + uTime) * 0.05 * uHover;
            pos.z += wave;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform sampler2D uTexture;
          uniform float uHover;

          void main() {
            vec2 uv = vUv;

            float strength = uHover * 0.03;

            vec2 offset = vec2(strength);

            float r = texture2D(uTexture, uv + offset).r;
            float g = texture2D(uTexture, uv).g;
            float b = texture2D(uTexture, uv - offset).b;

            vec3 color = vec3(r, g, b);

            // ↓ затемнение вместо засвета
            color *= (1.0 - uHover * 0.25);

            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
}