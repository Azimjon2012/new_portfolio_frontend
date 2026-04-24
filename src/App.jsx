import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import { motion, useMotionValue, useSpring } from "framer-motion";
import ShaderBackground from "./ShaderBackground";
import ParticleCanvas from "./Particles";

const API = "https://new-portfolio-backend-11l0.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  // global mouse
  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const res = await axios.post(`${API}/auth`, {
          email: u.email,
        });
        setRole(res.data.role);
      }
    });
    return () => unsub();
  }, []);

  // projects
  useEffect(() => {
    axios.get(`${API}/projects`).then((res) => {
      setProjects(res.data);
      setLoading(false);
    });
  }, []);

  const login = async () => {
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">

      {/* 🌌 DEPTH BACKGROUND */}
      <div className="absolute inset-0 -z-40 bg-[#050505]" />

      {/* far layer */}
      <motion.div
        className="absolute inset-0 -z-30 opacity-30"
        style={{
          transform: "translateZ(-200px) scale(2)",
        }}
      >
        <ShaderBackground />
      </motion.div>

      {/* mid particles */}
      <motion.div className="absolute inset-0 -z-20 opacity-40">
        <ParticleCanvas />
      </motion.div>

      {/* dynamic global light */}
      <motion.div
        className="pointer-events-none fixed w-[800px] h-[800px] rounded-full blur-[200px] opacity-40 mix-blend-screen -z-10"
        style={{
          left: smoothX,
          top: smoothY,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.35), rgba(59,130,246,0.25), transparent 70%)",
        }}
      />

      {/* header */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex justify-between items-center relative z-10">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Portfolio
        </h1>

        {!user ? (
          <Button onClick={login}>Login</Button>
        ) : (
          <div className="flex gap-3 items-center">
            <span className="text-xs text-gray-300">{user.email}</span>
            <Button onClick={logout}>Logout</Button>
          </div>
        )}
      </div>

      {/* grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse"/>
            ))
          : projects.map((p, i) => (
              <Card key={p._id} p={p} i={i} />
            ))}
      </div>
    </div>
  );
}

/* BUTTON */
function Button({ children, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={onClick}
      className="px-5 py-2 rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/10"
    >
      {children}
    </motion.button>
  );
}

/* 3D CARD */
function Card({ p, i }) {
  const ref = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const smoothX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    rotateY.set((x - midX) / 15);
    rotateX.set(-(y - midY) / 15);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{
        rotateX: smoothX,
        rotateY: smoothY,
        transformPerspective: 1000,
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      className="relative rounded-2xl overflow-hidden
      bg-white/[0.06]
      backdrop-blur-xl
      border border-white/10
      shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
    >
      {/* light reflection */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition duration-500
      bg-gradient-to-br from-white/10 via-transparent to-transparent"/>

      <img
        src={p.image}
        className="w-full h-52 object-cover"
      />

      <div className="p-4">
        <h2 className="text-base font-semibold">{p.title}</h2>
        <p className="text-xs text-gray-400">{p.description}</p>
      </div>
    </motion.div>
  );
}

export default App;