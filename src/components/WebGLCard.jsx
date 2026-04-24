import { Canvas, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { useRef } from "react";
import { motion, useSpring } from "framer-motion";
import ShaderImage from "./ShaderImage";

export default function WebGLCard({ image }) {
  const texture = useLoader(TextureLoader, image);

  const hover = useRef(0);

  // inertia physics
  const tiltX = useSpring(0, { stiffness: 120, damping: 15 });
  const tiltY = useSpring(0, { stiffness: 120, damping: 15 });

  const move = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    tiltY.set(x * 15);
    tiltX.set(-y * 15);

    hover.current = 1;
  };

  const leave = () => {
    tiltX.set(0);
    tiltY.set(0);
    hover.current = 0;
  };

  return (
    <motion.div
      onMouseMove={move}
      onMouseLeave={leave}
      style={{
        rotateX: tiltX,
        rotateY: tiltY,
        transformPerspective: 1000,
      }}
      className="w-full h-48 rounded-xl overflow-hidden"
    >
      <Canvas>
        <ShaderImage texture={texture} hover={hover} />
      </Canvas>
    </motion.div>
  );
}