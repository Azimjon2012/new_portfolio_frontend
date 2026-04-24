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
    setPos({ x: x / 6, y: y / 6 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      className="transition duration-200 inline-block"
    >
      {children}
    </div>
  );
}

/* ---------- App ---------- */
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
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">

      {/* 🌌 мягкий фон */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[800px] h-[800px] bg-purple-600/20 blur-[200px] rounded-full -top-40 -left-40" />
        <div className="absolute w-[700px] h-[700px] bg-blue-500/20 blur-[200px] rounded-full -bottom-40 -right-40" />
      </div>

      {/* 💡 cursor glow */}
      <div
        className="pointer-events-none fixed w-[500px] h-[500px] rounded-full blur-[160px] opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.6), transparent 70%)",
          left: pos.x - 250,
          top: pos.y - 250,
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center px-8 py-6">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-semibold tracking-tight"
        >
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Portfolio
          </span>
        </motion.h1>

        {!user ? (
          <Magnetic>
            <button
              onClick={login}
              className="px-5 py-2 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 transition"
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

      {/* ADMIN */}
      {role === "admin" && (
        <div className="mx-8 mb-10 p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-2 bg-white/10 rounded-lg"
              />
            ))}
          </div>

          <button
            onClick={addProject}
            className="mt-4 px-4 py-2 bg-purple-500 rounded-xl"
          >
            Add Project
          </button>
        </div>
      )}

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 px-8 pb-12">
          {projects.map((p, i) => (
            <Tilt key={p._id} scale={1.03}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/40 transition"
              >
                <img
                  src={p.image || "https://via.placeholder.com/400"}
                  className="w-full h-48 object-cover group-hover:scale-105 transition duration-500"
                />

                <div className="p-4">
                  <h2 className="font-medium">{p.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4 text-sm">

                    <Magnetic>
                      <button onClick={() => like(p._id)}>
                        👍 {p.likes?.length || 0}
                      </button>
                    </Magnetic>

                    <Magnetic>
                      <button onClick={() => dislike(p._id)}>
                        👎 {p.dislikes?.length || 0}
                      </button>
                    </Magnetic>

                    <Magnetic>
                      <button onClick={() => window.open(p.github)}>
                        GitHub
                      </button>
                    </Magnetic>

                    <Magnetic>
                      <button onClick={() => window.open(p.live)}>
                        Live
                      </button>
                    </Magnetic>

                    {role === "admin" && (
                      <button onClick={() => deleteProject(p._id)}>
                        Delete
                      </button>
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