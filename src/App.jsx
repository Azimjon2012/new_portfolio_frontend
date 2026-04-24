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

  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

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
    await axios.post(`${API}/projects`, form);
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

      {/* 🌌 Background */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute w-[600px] h-[600px] bg-purple-600/30 blur-[150px] rounded-full -top-40 -left-40" />
        <div className="absolute w-[500px] h-[500px] bg-blue-500/20 blur-[150px] rounded-full bottom-[-150px] right-[-150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.1),transparent_60%)]" />
      </div>

      {/* 💡 Cursor light */}
      <div
        className="pointer-events-none fixed w-[500px] h-[500px] rounded-full blur-[180px] opacity-20"
        style={{
          background: "radial-gradient(circle, #9333ea, transparent)",
          left: pos.x - 250,
          top: pos.y - 250,
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center p-6">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
        >
          My Portfolio
        </motion.h1>

        {!user ? (
          <button
            onClick={login}
            className="bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 rounded-xl hover:scale-105 transition shadow-lg"
          >
            Login
          </button>
        ) : (
          <div className="flex gap-3">
            <span className="text-sm opacity-70">{user.email}</span>
            <button onClick={logout} className="bg-red-500 px-3 rounded">
              Logout
            </button>
          </div>
        )}
      </div>

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center animate-pulse">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 px-6">
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

function Card({ p, i, role, like, dislike, deleteProject }) {
  const ref = useRef(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientY - r.top - r.height / 2) / 25;
    const y = (e.clientX - r.left - r.width / 2) / 25;
    setRot({ x: -x, y });
  };

  const leave = () => setRot({ x: 0, y: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08 }}
    >
      <div
        ref={ref}
        onMouseMove={move}
        onMouseLeave={leave}
        style={{
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        }}
        className="group relative rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-xl hover:shadow-purple-500/30 transition"
      >
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition"/>

        <img
          src={p.image || "https://via.placeholder.com/400"}
          className="w-full h-52 object-cover group-hover:scale-110 transition duration-500"
        />

        <div className="p-4 relative z-10">
          <h2 className="font-bold text-lg">{p.title}</h2>
          <p className="text-sm opacity-70 mb-3">{p.description}</p>

          <div className="flex gap-2 flex-wrap">

            <button onClick={() => like(p._id)} className="bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 rounded-xl hover:scale-105 transition">
              👍 {p.likes?.length || 0}
            </button>

            <button onClick={() => dislike(p._id)} className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 rounded-xl hover:scale-105 transition">
              👎 {p.dislikes?.length || 0}
            </button>

            <button onClick={() => window.open(p.github, "_blank")} className="bg-blue-600 px-3 py-1 rounded-xl">
              GitHub
            </button>

            <button onClick={() => window.open(p.live, "_blank")} className="bg-green-500 px-3 py-1 rounded-xl">
              Live
            </button>

            {role === "admin" && (
              <button onClick={() => deleteProject(p._id)} className="bg-red-500 px-2 rounded">
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