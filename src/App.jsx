import { useEffect, useState } from "react";
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

  // 🔥 glowing cursor
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const res = await axios.post(`${API}/auth`, {
            email: u.email,
          });
          setRole(res.data.role);
        } catch (err) {
          console.log(err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const login = async () => {
    const result = await signInWithPopup(auth, provider);
    const u = result.user;
    setUser(u);

    const res = await axios.post(`${API}/auth`, {
      email: u.email,
    });
    setRole(res.data.role);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* 🔥 cursor glow */}
      <div
        className="pointer-events-none fixed w-72 h-72 rounded-full blur-3xl opacity-30"
        style={{
          background: "radial-gradient(circle, #7c3aed, transparent)",
          left: pos.x - 150,
          top: pos.y - 150,
        }}
      />

      {/* gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/20 -z-10" />

      {/* HEADER */}
      <div className="flex justify-between items-center p-6">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text"
        >
          My Portfolio
        </motion.h1>

        {!user ? (
          <button
            onClick={login}
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2 rounded-xl shadow-lg hover:scale-110 transition"
          >
            Login
          </button>
        ) : (
          <div className="flex gap-4">
            <span>{user.email}</span>
            <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ADMIN PANEL */}
      {role === "admin" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-6 mb-10 p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
          <h2 className="text-xl mb-4">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                placeholder={k}
                onChange={handleChange}
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
        <p className="text-center animate-pulse">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-6">
          {projects.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05, rotateX: 3 }}
              className="group rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-xl hover:shadow-purple-500/40 transition"
            >
              <img
                src={p.image || "https://via.placeholder.com/400"}
                className="w-full h-48 object-cover group-hover:scale-110 transition duration-500"
              />

              <div className="p-4">
                <h2 className="text-lg font-bold">{p.title}</h2>
                <p className="text-sm opacity-70">{p.description}</p>

                <div className="flex gap-2 flex-wrap mt-3">

                  <button
                    onClick={() => like(p._id)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 rounded-xl hover:scale-110 transition shadow"
                  >
                    👍 {p.likes?.length || 0}
                  </button>

                  <button
                    onClick={() => dislike(p._id)}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 rounded-xl hover:scale-110 transition shadow"
                  >
                    👎 {p.dislikes?.length || 0}
                  </button>

                  <a href={p.github} target="_blank">
                    <button className="bg-blue-600 px-3 py-1 rounded-xl">GitHub</button>
                  </a>

                  <a href={p.live} target="_blank">
                    <button className="bg-green-500 px-3 py-1 rounded-xl">Live</button>
                  </a>

                  {role === "admin" && (
                    <button
                      onClick={() => deleteProject(p._id)}
                      className="bg-red-500 px-3 py-1 rounded-xl"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;