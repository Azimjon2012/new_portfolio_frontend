import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import { motion } from "framer-motion";

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

  // 💡 cursor glow
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // 🔐 auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const res = await axios.post(`${API}/auth`, { email: u.email });
          setRole(res.data.role);
        } catch (e) {
          console.log(e);
        }
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
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">

      {/* 🌌 layered background */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute w-[520px] h-[520px] bg-purple-600/30 blur-[140px] rounded-full -top-24 -left-24 animate-pulse" />
        <div className="absolute w-[420px] h-[420px] bg-blue-500/25 blur-[140px] rounded-full -bottom-24 -right-24 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_40%)]" />
      </div>

      {/* 💡 cursor glow */}
      <div
        className="pointer-events-none fixed w-[420px] h-[420px] rounded-full blur-[160px] opacity-20 -z-10"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.7), transparent 60%)",
          left: pos.x - 210,
          top: pos.y - 210,
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center p-6">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(168,85,247,0.6)]"
        >
          My Portfolio
        </motion.h1>

        {!user ? (
          <button
            onClick={login}
            className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 rounded-xl shadow-lg hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition"
          >
            Login
          </button>
        ) : (
          <div className="flex gap-4 items-center">
            <span className="text-xs md:text-sm opacity-70">{user.email}</span>
            <button
              onClick={logout}
              className="bg-red-500 px-3 py-1 rounded-xl hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ADMIN */}
      {role === "admin" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-10 p-6 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:shadow-[0_0_60px_rgba(168,85,247,0.25)] transition"
        >
          <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-2 rounded text-black"
              />
            ))}
          </div>

          <button
            onClick={addProject}
            className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 rounded-xl hover:scale-105 transition"
          >
            Add Project
          </button>
        </motion.div>
      )}

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center animate-pulse opacity-60">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-6">
          {projects.map((p, i) => (
            <Card
              key={p._id}
              p={p}
              i={i}
              role={role}
              like={like}
              dislike={dislike}
              deleteProject={deleteProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 🧠 Card with safe parallax (no click blocking)
function Card({ p, i, role, like, dislike, deleteProject }) {
  const ref = useRef(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = (e.clientX - rect.left - rect.width / 2) / 20;
    setRot({ x: -x, y });
  };

  const onLeave = () => setRot({ x: 0, y: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
    >
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transformStyle: "preserve-3d",
        }}
        className="group relative rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-purple-500/40"
      >
        {/* glow overlay (НЕ блокирует клики) */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition" />

        <img
          src={p.image || "https://via.placeholder.com/400"}
          className="w-full h-48 object-cover group-hover:scale-110 transition duration-500"
        />

        <div className="p-4 relative z-20">
          <h2 className="font-bold text-lg">{p.title}</h2>
          <p className="text-sm opacity-70 mb-3">{p.description}</p>

          <div className="flex gap-2 flex-wrap">

            <button
              onClick={() => like(p._id)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 rounded-xl shadow-lg hover:scale-105 hover:shadow-blue-500/40 transition"
            >
              👍 {p.likes?.length || 0}
            </button>

            <button
              onClick={() => dislike(p._id)}
              className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 rounded-xl shadow-lg hover:scale-105 hover:shadow-red-500/40 transition"
            >
              👎 {p.dislikes?.length || 0}
            </button>

            <button
              onClick={() => window.open(p.github, "_blank")}
              className="bg-blue-600 px-3 py-1 rounded-xl hover:scale-105 transition"
            >
              GitHub
            </button>

            <button
              onClick={() => window.open(p.live, "_blank")}
              className="bg-green-500 px-3 py-1 rounded-xl hover:scale-105 transition"
            >
              Live
            </button>

            {role === "admin" && (
              <button
                onClick={() => deleteProject(p._id)}
                className="bg-red-500 px-2 rounded"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default App;