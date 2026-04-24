import { useEffect, useState } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import {
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import Tilt from "react-parallax-tilt";
import ShaderBackground from "./ShaderBackground";
import ParticleCanvas from "./Particles";
import Lenis from "@studio-freight/lenis";

const API = "https://new-portfolio-backend-11l0.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, {
    stiffness: 60,
    damping: 12,
    mass: 0.4,
  });

  const smoothY = useSpring(mouseY, {
    stiffness: 60,
    damping: 12,
    mass: 0.4,
  });

  // 🎯 Smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08 });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);

  // 🎯 Cursor
  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // 🔐 Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsub();
  }, []);

  // 📦 Projects
  useEffect(() => {
    axios.get(`${API}/projects`)
      .then(res => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  const login = async () => {
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">

      {/* 🌌 GPU BACKGROUND */}
      <ShaderBackground />

      {/* 🧬 PARTICLES */}
      <div className="absolute inset-0 -z-20 opacity-40">
        <ParticleCanvas />
      </div>

      {/* 💡 CURSOR LIGHT */}
      <motion.div
        className="pointer-events-none fixed w-[600px] h-[600px] rounded-full blur-[200px] opacity-40 mix-blend-screen"
        style={{
          left: smoothX,
          top: smoothY,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.35), transparent 60%)",
        }}
      />

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Portfolio
        </h1>

        {!user ? (
          <Button onClick={login}>Login</Button>
        ) : (
          <Button onClick={logout}>Logout</Button>
        )}
      </div>

      {/* PROJECTS */}
      <div className="max-w-7xl mx-auto px-6 pb-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">

        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl"/>
            ))
          : projects.map((p, i) => (
              <Card key={p._id} p={p} i={i} />
            ))
        }

      </div>
    </div>
  );
}

/* 🔘 BUTTON */
function Button({ children, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl hover:bg-white/20 transition"
    >
      {children}
    </motion.button>
  );
}

/* 🧠 CARD */
function Card({ p, i }) {
  return (
    <Tilt scale={1.05}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        whileHover={{ y: -10 }}
        className="relative rounded-2xl overflow-hidden
        bg-white/[0.06]
        backdrop-blur-3xl
        border border-white/10
        shadow-[0_0_40px_rgba(139,92,246,0.15)]"
      >
        <img
          src={p.image}
          className="w-full h-52 object-cover hover:scale-110 transition duration-700"
        />

        <div className="p-5">
          <h2 className="text-lg font-semibold">{p.title}</h2>
          <p className="text-sm text-gray-400">{p.description}</p>
        </div>
      </motion.div>
    </Tilt>
  );
}

export default App;