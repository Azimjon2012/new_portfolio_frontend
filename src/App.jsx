import { useEffect, useState } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
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

  // 🧠 magnetic buttons
  const magnetic = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    e.target.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  };

  const reset = (e) => (e.target.style.transform = "translate(0,0)");

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* 🌌 PARTICLES */}
      <Particles
        options={{
          particles: {
            number: { value: 30 },
            size: { value: 2 },
            move: { speed: 0.4 },
            opacity: { value: 0.3 },
          },
        }}
        className="absolute inset-0 -z-20"
      />

      {/* 💡 cursor glow */}
      <div
        className="pointer-events-none fixed w-96 h-96 rounded-full blur-[140px] opacity-20"
        style={{
          background: "radial-gradient(circle, #9333ea, transparent)",
          left: pos.x - 200,
          top: pos.y - 200,
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between p-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
          My Portfolio
        </h1>

        {!user ? (
          <button
            onClick={login}
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-xl"
          >
            Login
          </button>
        ) : (
          <div className="flex gap-3">
            <span>{user.email}</span>
            <button onClick={logout} className="bg-red-500 px-2 rounded">
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ADMIN */}
      {role === "admin" && (
        <div className="mx-6 mb-10 p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
          <h2 className="mb-4">Admin Panel</h2>
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
            className="mt-4 bg-purple-500 px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      )}

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-6">
          {projects.map((p, i) => (
            <Tilt key={p._id} glareEnable={true} glareMaxOpacity={0.3}>
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl hover:shadow-purple-500/40"
              >
                <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition"/>

                <img
                  src={p.image || "https://via.placeholder.com/400"}
                  className="w-full h-48 object-cover group-hover:scale-110 transition"
                />

                <div className="p-4">
                  <h2 className="font-bold">{p.title}</h2>
                  <p className="text-sm opacity-70">{p.description}</p>

                  <div className="flex gap-2 mt-3 flex-wrap">

                    <button
                      onMouseMove={magnetic}
                      onMouseLeave={reset}
                      onClick={() => like(p._id)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 rounded-xl"
                    >
                      👍 {p.likes?.length || 0}
                    </button>

                    <button
                      onMouseMove={magnetic}
                      onMouseLeave={reset}
                      onClick={() => dislike(p._id)}
                      className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 rounded-xl"
                    >
                      👎 {p.dislikes?.length || 0}
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