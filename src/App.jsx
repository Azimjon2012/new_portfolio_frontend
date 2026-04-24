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
    <div className="min-h-screen w-full bg-[#050505] text-white relative overflow-x-hidden">

      {/* FIX: background layer */}
      <div className="fixed inset-0 -z-50 bg-[#050505]" />

      {/* FIX: shader (ограничен) */}
      <div className="fixed inset-0 -z-40 overflow-hidden">
        <ShaderBackground />
      </div>

      {/* FIX: particles */}
      <div className="fixed inset-0 -z-30 opacity-30 pointer-events-none">
        <ParticleCanvas />
      </div>

      {/* subtle glow */}
      <div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] bg-purple-500/20 blur-[150px] rounded-full -z-20" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-blue-500/20 blur-[150px] rounded-full -z-20" />

      {/* HEADER */}
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

      {/* GRID */}
      <div className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-5 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md"
    >
      {children}
    </motion.button>
  );
}

/* CARD */
function Card({ p, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      whileHover={{ y: -6 }}
      className="rounded-2xl overflow-hidden
      bg-white/[0.06]
      backdrop-blur-xl
      border border-white/10
      shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
    >
      <img src={p.image} className="w-full h-48 object-cover" />

      <div className="p-4">
        <h2 className="text-base font-semibold">{p.title}</h2>
        <p className="text-xs text-gray-400">{p.description}</p>
      </div>
    </motion.div>
  );
}

export default App;