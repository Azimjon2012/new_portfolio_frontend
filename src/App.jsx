import { useEffect, useState } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";

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

      {/* 🌌 background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[500px] h-[500px] bg-purple-600 opacity-20 blur-[120px] rounded-full top-[-100px] left-[-100px]" />
        <div className="absolute w-[400px] h-[400px] bg-blue-500 opacity-20 blur-[120px] rounded-full bottom-[-100px] right-[-100px]" />
      </div>

      {/* 💡 cursor glow */}
      <div
        className="pointer-events-none fixed w-80 h-80 rounded-full blur-[120px] opacity-20"
        style={{
          background: "radial-gradient(circle, #7c3aed, transparent)",
          left: pos.x - 160,
          top: pos.y - 160,
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center p-6">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
        >
          My Portfolio
        </motion.h1>

        {!user ? (
          <button
            onClick={login}
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-xl hover:scale-105 transition"
          >
            Login
          </button>
        ) : (
          <div className="flex gap-3 items-center">
            <span className="text-sm opacity-70">{user.email}</span>
            <button onClick={logout} className="bg-red-500 px-2 rounded">
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ADMIN */}
      {role === "admin" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-6 mb-10 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl"
        >
          <h2 className="mb-4 text-lg">Admin Panel</h2>

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
            className="mt-4 bg-purple-500 px-4 py-2 rounded-xl"
          >
            Add Project
          </button>
        </motion.div>
      )}

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center animate-pulse">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-6">
          {projects.map((p, i) => (
            <Tilt key={p._id} scale={1.03} glareEnable={false}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:shadow-purple-500/30 transition"
              >
                {/* overlay без блокировки */}
                <div className="absolute inset-0 pointer-events-none bg-purple-500/5 opacity-0 group-hover:opacity-100 transition" />

                <img
                  src={p.image || "https://via.placeholder.com/400"}
                  className="w-full h-48 object-cover group-hover:scale-110 transition"
                />

                <div className="p-4 relative z-20">
                  <h2 className="font-bold">{p.title}</h2>
                  <p className="text-sm opacity-70">{p.description}</p>

                  <div className="flex gap-2 flex-wrap mt-3">

                    <button
                      onClick={() => like(p._id)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 rounded-xl hover:scale-105 transition"
                    >
                      👍 {p.likes?.length || 0}
                    </button>

                    <button
                      onClick={() => dislike(p._id)}
                      className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 rounded-xl hover:scale-105 transition"
                    >
                      👎 {p.dislikes?.length || 0}
                    </button>

                    <button
                      onClick={() => window.open(p.github, "_blank")}
                      className="bg-blue-600 px-3 py-1 rounded-xl"
                    >
                      GitHub
                    </button>

                    <button
                      onClick={() => window.open(p.live, "_blank")}
                      className="bg-green-500 px-3 py-1 rounded-xl"
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
              </motion.div>
            </Tilt>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;