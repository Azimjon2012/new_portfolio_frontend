import { useEffect, useState } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Tilt from "react-parallax-tilt";
import ShaderBackground from "./ShaderBackground";

const API = "https://new-portfolio-backend-11l0.onrender.com";

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

  // CURSOR SYSTEM
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  const glowScale = useTransform(smoothX, [0, 1920], [1, 1.2]);

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const res = await axios.post(`${API}/auth`, { email: u.email });
        setRole(res.data.role);
      }
    });
    return () => unsub();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const login = async () => {
    const res = await signInWithPopup(auth, provider);
    setUser(res.user);
    const r = await axios.post(`${API}/auth`, { email: res.user.email });
    setRole(r.data.role);
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
    setForm({ title: "", description: "", image: "", github: "", live: "" });
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
    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* 🌌 GPU BACKGROUND */}
      <ShaderBackground />

      {/* 🌑 OVERLAY DEPTH */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none -z-10" />

      {/* 💡 CURSOR LIGHT */}
      <motion.div
        className="pointer-events-none fixed w-[520px] h-[520px] rounded-full blur-[180px] opacity-30"
        style={{
          left: smoothX,
          top: smoothY,
          transform: "translate(-50%, -50%)",
          scale: glowScale,
          background:
            "radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)",
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center p-6">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-extrabold tracking-tight"
        >
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Portfolio
          </span>
        </motion.h1>

        <div className="flex items-center gap-3">
          {!user ? (
            <MagneticButton onClick={login}>Login</MagneticButton>
          ) : (
            <>
              <span className="text-sm text-gray-400">{user.email}</span>
              <MagneticButton onClick={logout}>Logout</MagneticButton>
            </>
          )}
        </div>
      </div>

      {/* ADMIN PANEL */}
      {role === "admin" && (
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-6 mb-10 p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-xl"
        >
          <h2 className="mb-4 font-semibold">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-3 rounded-xl bg-white/10 focus:ring-2 focus:ring-purple-500"
              />
            ))}
          </div>

          <MagneticButton onClick={addProject}>
            Add Project
          </MagneticButton>
        </motion.div>
      )}

      {/* PROJECTS */}
      <motion.div
        layout
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 pb-10"
      >
        {loading
          ? [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-60 bg-white/5 animate-pulse rounded-2xl"
              />
            ))
          : projects.map((p, i) => (
              <ProjectCard
                key={p._id}
                p={p}
                i={i}
                like={like}
                dislike={dislike}
                deleteProject={deleteProject}
                role={role}
              />
            ))}
      </motion.div>
    </div>
  );
}

/* ---------- BUTTON ---------- */

function MagneticButton({ children, onClick }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };

  return (
    <motion.button
      onMouseMove={handleMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="px-5 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition"
    >
      {children}
    </motion.button>
  );
}

/* ---------- CARD ---------- */

function ProjectCard({ p, i, like, dislike, deleteProject, role }) {
  return (
    <Tilt glareEnable glareMaxOpacity={0.25} scale={1.03}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06, type: "spring" }}
        whileHover={{ y: -14 }}
        className="group relative rounded-3xl overflow-hidden 
        bg-gradient-to-b from-white/10 to-white/[0.02] 
        border border-white/10 backdrop-blur-2xl shadow-2xl"
      >
        {/* GLOW */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 
        bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-xl" />

        <img
          src={p.image || "https://via.placeholder.com/400"}
          className="w-full h-52 object-cover transition duration-700 group-hover:scale-110"
        />

        <div className="p-5 relative z-10">
          <h2 className="font-semibold text-lg">{p.title}</h2>
          <p className="text-sm text-gray-400 mt-1">{p.description}</p>

          <div className="flex gap-2 mt-4 flex-wrap">
            <ActionButton onClick={() => like(p._id)}>
              👍 {p.likes?.length || 0}
            </ActionButton>

            <ActionButton onClick={() => dislike(p._id)}>
              👎 {p.dislikes?.length || 0}
            </ActionButton>

            <ActionButton onClick={() => window.open(p.github)}>
              GitHub
            </ActionButton>

            <ActionButton onClick={() => window.open(p.live)}>
              Live
            </ActionButton>

            {role === "admin" && (
              <ActionButton danger onClick={() => deleteProject(p._id)}>
                Delete
              </ActionButton>
            )}
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
}

/* ---------- ACTION BUTTON ---------- */

function ActionButton({ children, onClick, danger }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-sm backdrop-blur-md border border-white/10 transition
      ${
        danger
          ? "bg-red-500/20 hover:bg-red-500/40"
          : "bg-white/10 hover:bg-white/20"
      }`}
    >
      {children}
    </motion.button>
  );
}

export default App;