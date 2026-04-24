import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import {
  motion,
  useMotionValue,
  useSpring,
  useVelocity,
} from "framer-motion";
import Scene3D from "./Scene3D";

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

  // 🔥 mouse
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // ⚡ velocity scroll
  const scrollY = useMotionValue(0);
  const velocity = useVelocity(scrollY);
  const scale = useSpring(velocity, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleScroll = () => {
      scrollY.set(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔐 auth
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

  // 📦 projects
  const fetchProjects = async () => {
    const res = await axios.get(`${API}/projects`);
    setProjects(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
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
    <motion.div
      style={{
        scale: scale.get() > 5 ? 1.01 : 1,
      }}
      className="min-h-screen w-full bg-[#050505] text-white relative overflow-x-hidden"
    >
      {/* 🌌 WebGL background */}
      <div className="fixed inset-0 -z-50 pointer-events-none">
        <Scene3D />
      </div>

      {/* overlay depth */}
      <div className="fixed inset-0 -z-40 bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none" />

      {/* 💡 cursor glow */}
      <motion.div
        className="pointer-events-none fixed w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 mix-blend-screen"
        style={{
          left: smoothX,
          top: smoothY,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)",
        }}
      />

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

      {/* ADMIN */}
      {role === "admin" && (
        <div className="max-w-6xl mx-auto px-6 mb-10 p-6 rounded-2xl
        bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-xl relative z-10">
          <h2 className="text-sm mb-4 text-gray-300">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-2 rounded-lg bg-white/[0.07] border border-white/10 text-sm outline-none focus:border-purple-400"
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
      <div className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse"/>
            ))
          : projects.map((p, i) => (
              <Card
                key={p._id}
                p={p}
                i={i}
                like={like}
                dislike={dislike}
                deleteProject={deleteProject}
                role={role}
              />
            ))}
      </div>
    </motion.div>
  );
}

/* BUTTON */
function Button({ children, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-5 py-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md relative z-10"
    >
      {children}
    </motion.button>
  );
}

/* CARD */
function Card({ p, i, like, dislike, deleteProject, role }) {
  const ref = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const smoothX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const smoothY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const move = (e) => {
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
      onMouseMove={move}
      onMouseLeave={reset}
      style={{
        rotateX: smoothX,
        rotateY: smoothY,
        transformPerspective: 1000,
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      whileHover={{ y: -8 }}
      className="group relative rounded-2xl overflow-hidden
      bg-white/[0.06]
      backdrop-blur-xl
      border border-white/10
      shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
    >
      {/* spotlight (НЕ БЛОКИРУЕТ КЛИКИ) */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition
      bg-gradient-to-br from-white/10 to-transparent"/>

      <img src={p.image} className="w-full h-48 object-cover" />

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

/* MINI BUTTON */
function MiniButton({ children, onClick, danger }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`px-2 py-1 rounded-md text-xs ${
        danger
          ? "bg-red-500/20 hover:bg-red-500/40"
          : "bg-white/[0.1] hover:bg-white/[0.2]"
      }`}
    >
      {children}
    </motion.button>
  );
}

export default App;