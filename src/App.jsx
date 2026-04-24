import React, { useEffect, useState } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";

const API = "https://new-portfolio-backend-11l0.onrender.com";

/* ---------- Magnetic ---------- */
function Magnetic({ children }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    setPos({ x: x / 5, y: y / 5 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
      }}
      className="transition duration-200 inline-block"
    >
      {children}
    </div>
  );
}

/* ---------- Floating orbs ---------- */
function Orbs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute w-[900px] h-[900px] bg-purple-600/20 blur-[200px] rounded-full -top-40 -left-40 animate-pulse" />
      <div className="absolute w-[800px] h-[800px] bg-blue-500/20 blur-[200px] rounded-full -bottom-40 -right-40 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] bg-pink-500/10 blur-[180px] rounded-full top-[30%] left-[40%]" />
    </div>
  );
}

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
    <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden">

      <Orbs />

      {/* CURSOR LIGHT */}
      <div
        className="pointer-events-none fixed w-[600px] h-[600px] rounded-full blur-[180px] opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)",
          left: pos.x - 300,
          top: pos.y - 300,
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center px-10 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-semibold tracking-tight"
        >
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
            Portfolio
          </span>
        </motion.h1>

        {!user ? (
          <Magnetic>
            <button
              onClick={login}
              className="px-6 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 
              hover:bg-white/20 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition"
            >
              Login
            </button>
          </Magnetic>
        ) : (
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-400">{user.email}</span>
            <Magnetic>
              <button
                onClick={logout}
                className="px-4 py-1.5 bg-red-500/80 rounded-lg hover:bg-red-500 transition"
              >
                Logout
              </button>
            </Magnetic>
          </div>
        )}
      </div>

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 px-10 pb-16">
          {projects.map((p, i) => (
            <Tilt key={p._id} tiltMaxAngleX={12} tiltMaxAngleY={12} scale={1.05}>
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative rounded-3xl overflow-hidden border border-white/10 
                bg-white/5 backdrop-blur-xl 
                hover:border-purple-500/40 transition-all duration-500"
              >

                {/* GLOW FRAME */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 
                bg-gradient-to-r from-purple-500/20 via-transparent to-blue-500/20 blur-xl" />

                <img
                  src={p.image || "https://via.placeholder.com/400"}
                  className="w-full h-52 object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="p-5 relative z-10">
                  <h2 className="font-semibold text-lg group-hover:text-purple-300 transition">
                    {p.title}
                  </h2>

                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4 text-sm">

                    <Magnetic>
                      <button onClick={() => like(p._id)}>👍 {p.likes?.length || 0}</button>
                    </Magnetic>

                    <Magnetic>
                      <button onClick={() => dislike(p._id)}>👎 {p.dislikes?.length || 0}</button>
                    </Magnetic>

                    <Magnetic>
                      <button onClick={() => window.open(p.github)}>GitHub</button>
                    </Magnetic>

                    <Magnetic>
                      <button onClick={() => window.open(p.live)}>Live</button>
                    </Magnetic>

                    {role === "admin" && (
                      <button onClick={() => deleteProject(p._id)}>Delete</button>
                    )}

                  </div>
                </div>
              </motion.div>
            </Tilt>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;