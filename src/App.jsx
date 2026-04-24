import { useEffect, useState } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Lenis from "@studio-freight/lenis";
import Scene3D from "./Scene3D";
import WebGLCard from "./components/WebGLCard";

const API = "https://new-portfolio-backend-11l0.onrender.com";

/* =========================
   CURSOR (clean, minimal)
========================= */
function Cursor() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const sx = useSpring(x, { stiffness: 200, damping: 25 });
  const sy = useSpring(y, { stiffness: 200, damping: 25 });

  useEffect(() => {
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <motion.div
      style={{
        left: sx,
        top: sy,
        transform: "translate(-50%, -50%)",
      }}
      className="fixed z-[999] w-5 h-5 rounded-full pointer-events-none
      bg-white/20 backdrop-blur-xl border border-white/20 mix-blend-difference"
    />
  );
}

/* =========================
   MAGNETIC BUTTON
========================= */
function MagneticButton({ children, onClick }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });

  const move = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;

    x.set(px * 0.25);
    y.set(py * 0.25);
  };

  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      onMouseMove={move}
      onMouseLeave={leave}
      onClick={onClick}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.92 }}
      className="px-5 py-2 rounded-xl
      bg-gradient-to-br from-white/10 to-white/5
      border border-white/10 backdrop-blur-xl
      hover:shadow-xl transition will-change-transform"
    >
      {children}
    </motion.button>
  );
}

/* =========================
   MINI BUTTON
========================= */
function MiniButton({ children, onClick, danger }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`px-2 py-1 rounded-md text-xs transition ${
        danger
          ? "bg-red-500/20 hover:bg-red-500/40"
          : "bg-white/10 hover:bg-white/20"
      }`}
    >
      {children}
    </motion.button>
  );
}

/* =========================
   CARD (WebGL + depth + refraction)
========================= */
function Card({ p, like, dislike, deleteProject, role }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="group relative rounded-2xl overflow-hidden
      bg-white/5 backdrop-blur-xl border border-white/10"
    >
      {/* WEBGL IMAGE */}
      <WebGLCard image={p.image} />

      {/* iOS-like blur refraction */}
      <div className="absolute inset-0 backdrop-blur-[20px] opacity-0 group-hover:opacity-100 transition duration-300" />

      {/* CONTENT */}
      <div className="p-4 relative z-10">
        <h2 className="text-base font-semibold">{p.title}</h2>
        <p className="text-xs text-gray-400">{p.description}</p>

        <div className="flex gap-2 mt-4 flex-wrap">
          <MiniButton onClick={() => like(p._id)}>
            👍 {p.likes?.length || 0}
          </MiniButton>

          <MiniButton onClick={() => dislike(p._id)}>
            👎 {p.dislikes?.length || 0}
          </MiniButton>

          <MiniButton onClick={() => window.open(p.github)}>
            GitHub
          </MiniButton>

          <MiniButton onClick={() => window.open(p.live)}>
            Live
          </MiniButton>

          {role === "admin" && (
            <MiniButton danger onClick={() => deleteProject(p._id)}>
              Delete
            </MiniButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* =========================
   MAIN APP
========================= */
function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    github: "",
    live: "",
  });

  /* Lenis smooth scroll */
  useEffect(() => {
    const lenis = new Lenis({
      smooth: true,
      lerp: 0.08,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);

  /* AUTH */
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

  /* FETCH PROJECTS */
  const fetchProjects = async () => {
    const res = await axios.get(`${API}/projects`);
    setProjects(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /* ACTIONS */
  const login = async () => {
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addProject = async () => {
    if (!form.title) return;
    await axios.post(`${API}/projects`, form);
    setForm({
      title: "",
      description: "",
      image: "",
      github: "",
      live: "",
    });
    fetchProjects();
  };

  const deleteProject = async (id) => {
    await axios.delete(`${API}/projects/${id}`);
    fetchProjects();
  };

  const like = async (id) => {
    if (!user) return alert("Login first");
    await axios.post(`${API}/projects/${id}/like`, {
      userEmail: user.email,
    });
    fetchProjects();
  };

  const dislike = async (id) => {
    if (!user) return alert("Login first");
    await axios.post(`${API}/projects/${id}/dislike`, {
      userEmail: user.email,
    });
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden">
      <Cursor />

      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-50 pointer-events-none">
        <Scene3D />
      </div>

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex justify-between items-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Portfolio
        </h1>

        {!user ? (
          <MagneticButton onClick={login}>Login</MagneticButton>
        ) : (
          <div className="flex gap-3 items-center">
            <span className="text-xs text-gray-300">{user.email}</span>
            <MagneticButton onClick={logout}>Logout</MagneticButton>
          </div>
        )}
      </div>

      {/* ADMIN */}
      {role === "admin" && (
        <div className="max-w-6xl mx-auto px-6 mb-10 p-6 rounded-2xl
        bg-gradient-to-br from-white/10 to-white/5
        backdrop-blur-2xl border border-white/10">
          <h2 className="text-sm mb-4 text-gray-300">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-2 rounded-lg bg-black/40 border border-white/10 text-sm outline-none"
              />
            ))}
          </div>

          <button
            onClick={addProject}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-sm"
          >
            Add Project
          </button>
        </div>
      )}

      {/* PROJECTS */}
      <div className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse"/>
            ))
          : projects.map((p) => (
              <Card
                key={p._id}
                p={p}
                like={like}
                dislike={dislike}
                deleteProject={deleteProject}
                role={role}
              />
            ))}
      </div>
    </div>
  );
}

export default App;