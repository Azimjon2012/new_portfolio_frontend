import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import {
  motion,
  useMotionValue,
  useSpring,
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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 25 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 25 });

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

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
    <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-50 pointer-events-none">
        <Scene3D />
      </div>

      {/* GLOBAL LIGHT */}
      <motion.div
        className="pointer-events-none fixed w-[700px] h-[700px] rounded-full blur-[180px] opacity-40 mix-blend-screen -z-40"
        style={{
          left: smoothX,
          top: smoothY,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.5), rgba(59,130,246,0.3), transparent 70%)",
        }}
      />

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex justify-between items-center relative z-10">
        <h1 className="text-6xl font-extrabold tracking-tight 
        bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 
        bg-clip-text text-transparent 
        drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]">
          Azimjon's Portfolio
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

      {/* ADMIN PANEL */}
      {role === "admin" && (
        <div className="max-w-6xl mx-auto px-6 mb-12 p-8 rounded-3xl
        bg-gradient-to-br from-white/10 via-white/5 to-transparent
        backdrop-blur-3xl border border-white/10
        shadow-[0_0_80px_rgba(168,85,247,0.15)] 
        hover:shadow-[0_0_120px_rgba(168,85,247,0.25)]
        transition-all duration-500">

          <h2 className="text-sm mb-4 text-gray-300">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-2 rounded-lg bg-black/40 border border-white/10 text-sm outline-none focus:border-purple-400"
              />
            ))}
          </div>

          <Button onClick={addProject}>Add Project</Button>
        </div>
      )}

      {/* PROJECTS */}
      <div className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse"
              />
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

/* MAGNETIC BUTTON */
function Button({ children, onClick }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const smoothX = useSpring(x, { stiffness: 200, damping: 20 });
  const smoothY = useSpring(y, { stiffness: 200, damping: 20 });

  const move = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.3);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.3);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: smoothX, y: smoothY }}
      className="px-6 py-2 rounded-xl 
      bg-gradient-to-br from-purple-500/20 to-blue-500/20
      border border-white/10 backdrop-blur-xl 
      hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

/* CARD */
function Card({ p, like, dislike, deleteProject, role }) {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const smoothX = useSpring(x, { stiffness: 140, damping: 20 });
  const smoothY = useSpring(y, { stiffness: 140, damping: 20 });

  const smoothGlowX = useSpring(glowX, { stiffness: 200, damping: 30 });
  const smoothGlowY = useSpring(glowY, { stiffness: 200, damping: 30 });

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();

    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;

    x.set(px * 20);
    y.set(py * 20);

    glowX.set(e.clientX - r.left);
    glowY.set(e.clientY - r.top);
  };

  const reset = () => {
    x.set(0); y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={reset}
      style={{
        x: smoothX,
        y: smoothY,
        transformPerspective: 1200,
      }}
      whileHover={{ scale: 1.06 }}
      className="group relative rounded-2xl overflow-hidden
      bg-gradient-to-br from-white/10 to-white/5
      backdrop-blur-2xl border border-white/10
      shadow-[0_30px_80px_rgba(0,0,0,0.9)]"
    >

      {/* 💡 DYNAMIC GLOW */}
      <motion.div
        className="pointer-events-none absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition"
        style={{
          left: smoothGlowX,
          top: smoothGlowY,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.35), transparent 70%)",
        }}
      />

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
  const ref = useRef(null);

  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const smoothX = useSpring(glowX, { stiffness: 200, damping: 25 });
  const smoothY = useSpring(glowY, { stiffness: 200, damping: 25 });

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    glowX.set(e.clientX - r.left);
    glowY.set(e.clientY - r.top);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() => { glowX.set(0); glowY.set(0); }}
      className={`relative px-3 py-1 rounded-md text-xs overflow-hidden
      backdrop-blur-xl border border-white/10 transition
      ${danger
        ? "bg-red-500/20 hover:bg-red-500/40"
        : "bg-white/10 hover:bg-white/20"
      }`}
      onClick={onClick}
    >

      {/* 💡 BUTTON GLOW */}
      <motion.div
        className="pointer-events-none absolute w-[120px] h-[120px] rounded-full blur-[50px] opacity-0 hover:opacity-100 transition"
        style={{
          left: smoothX,
          top: smoothY,
          transform: "translate(-50%, -50%)",
          background: danger
            ? "radial-gradient(circle, rgba(239,68,68,0.4), transparent 70%)"
            : "radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)",
        }}
      />

      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export default App;