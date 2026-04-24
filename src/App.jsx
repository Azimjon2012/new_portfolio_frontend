import React, { useEffect, useState } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";

const API = "https://new-portfolio-backend-11l0.onrender.com";

// 🔥 Magnetic Button
function Magnetic({ children, className = "", strength = 40 }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setPos({ x: x / strength, y: y / strength });
  };

  const reset = () => setPos({ x: 0, y: 0 });

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      className={`inline-block transition-transform duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

// 🌌 Particles
function Particles() {
  const particles = Array.from({ length: 25 });

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {particles.map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDuration: `${2 + Math.random() * 4}s`,
          }}
        />
      ))}
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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      <Particles />

      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[700px] h-[700px] bg-purple-600 opacity-20 blur-[180px] rounded-full top-[-200px] left-[-200px] animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-blue-500 opacity-20 blur-[180px] rounded-full bottom-[-200px] right-[-200px] animate-pulse" />
      </div>

      {/* CURSOR */}
      <div
        className="pointer-events-none fixed w-[420px] h-[420px] rounded-full blur-[150px] opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.7), transparent 70%)",
          left: pos.x - 210,
          top: pos.y - 210,
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center p-6">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
        >
          My Portfolio
        </motion.h1>

        {!user ? (
          <Magnetic>
            <button
              onClick={login}
              className="bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 rounded-2xl shadow-lg"
            >
              Login
            </button>
          </Magnetic>
        ) : (
          <div className="flex gap-3 items-center">
            <span className="text-sm opacity-70">{user.email}</span>
            <Magnetic>
              <button onClick={logout} className="bg-red-500 px-3 py-1 rounded-xl">
                Logout
              </button>
            </Magnetic>
          </div>
        )}
      </div>

      {/* ADMIN */}
      {role === "admin" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-6 mb-10 p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl"
        >
          <h2 className="mb-4">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-3 rounded-xl bg-white/10 text-white"
              />
            ))}
          </div>

          <button onClick={addProject} className="mt-4 bg-purple-500 px-4 py-2 rounded-xl">
            Add Project
          </button>
        </motion.div>
      )}

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center animate-pulse">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 pb-10">
          {projects.map((p, i) => (
            <Tilt key={p._id}>
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl hover:-translate-y-2 transition"
              >

                <img
                  src={p.image || "https://via.placeholder.com/400"}
                  className="w-full h-52 object-cover group-hover:scale-110 transition"
                />

                <div className="p-5">
                  <h2>{p.title}</h2>
                  <p className="text-sm opacity-70">{p.description}</p>

                  <div className="flex gap-2 flex-wrap mt-3">

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