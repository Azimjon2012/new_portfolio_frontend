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

      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[700px] h-[700px] bg-purple-600 opacity-20 blur-[180px] rounded-full top-[-200px] left-[-200px] animate-pulse" />
        <div className="absolute w-[600px] h-[600px] bg-blue-500 opacity-20 blur-[180px] rounded-full bottom-[-200px] right-[-200px] animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-pink-500 opacity-10 blur-[150px] rounded-full top-[40%] left-[30%]" />
      </div>

      {/* CURSOR GLOW */}
      <div
        className="pointer-events-none fixed w-[420px] h-[420px] rounded-full blur-[150px] opacity-30 transition duration-200"
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
          className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent tracking-tight"
        >
          My Portfolio
        </motion.h1>

        {!user ? (
          <button
            onClick={login}
            className="bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2 rounded-2xl 
            shadow-lg hover:scale-110 hover:shadow-purple-500/40 transition-all duration-300"
          >
            Login
          </button>
        ) : (
          <div className="flex gap-3 items-center">
            <span className="text-sm opacity-70">{user.email}</span>
            <button
              onClick={logout}
              className="bg-red-500 px-3 py-1 rounded-xl hover:scale-105 transition"
            >
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
          className="mx-6 mb-10 p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(124,58,237,0.25)]"
        >
          <h2 className="mb-4 text-lg font-semibold">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-3 rounded-xl bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            ))}
          </div>

          <button
            onClick={addProject}
            className="mt-5 bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 rounded-xl hover:scale-105 transition shadow-lg"
          >
            Add Project
          </button>
        </motion.div>
      )}

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center animate-pulse text-gray-400">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 pb-10">
          {projects.map((p, i) => (
            <Tilt key={p._id} scale={1.05} tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.03 }}
                className="group relative bg-white/5 backdrop-blur-2xl border border-white/10 
                rounded-3xl overflow-hidden shadow-2xl 
                hover:shadow-purple-500/40 hover:-translate-y-2 transition-all duration-500"
              >

                {/* OVERLAY */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-500">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent" />
                </div>

                <img
                  src={p.image || "https://via.placeholder.com/400"}
                  className="w-full h-52 object-cover transition duration-500 group-hover:scale-110 group-hover:brightness-110"
                />

                <div className="p-5 relative z-20">
                  <h2 className="font-bold text-lg tracking-wide">
                    {p.title}
                  </h2>

                  <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="flex gap-2 flex-wrap mt-4">

                    <button
                      onClick={() => like(p._id)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 rounded-xl 
                      shadow-md hover:scale-110 hover:shadow-purple-500/40 transition-all duration-300"
                    >
                      👍 {p.likes?.length || 0}
                    </button>

                    <button
                      onClick={() => dislike(p._id)}
                      className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-xl 
                      hover:scale-110 transition-all duration-300"
                    >
                      👎 {p.dislikes?.length || 0}
                    </button>

                    <button
                      onClick={() => window.open(p.github, "_blank")}
                      className="bg-black/70 backdrop-blur px-3 py-1.5 rounded-xl 
                      hover:bg-black hover:scale-110 transition-all duration-300"
                    >
                      GitHub
                    </button>

                    <button
                      onClick={() => window.open(p.live, "_blank")}
                      className="bg-green-500/80 px-3 py-1.5 rounded-xl 
                      hover:bg-green-500 hover:scale-110 transition-all duration-300"
                    >
                      Live
                    </button>

                    {role === "admin" && (
                      <button
                        onClick={() => deleteProject(p._id)}
                        className="bg-red-500 px-3 py-1.5 rounded-xl hover:scale-105 transition"
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