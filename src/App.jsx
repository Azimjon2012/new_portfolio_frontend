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
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      setUser(u);

      const res = await axios.post(`${API}/auth`, {
        email: u.email,
      });

      setRole(res.data.role);
    } catch (err) {
      console.log(err);
    }
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
    if (!form.title) return;

    try {
      await axios.post(`${API}/projects`, form);
      setForm({ title: "", description: "", image: "", github: "", live: "" });
      fetchProjects();
    } catch (err) {
      console.log(err);
    }
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
    <div className="min-h-screen bg-black text-white px-6 py-10 relative overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-blue-900/30 to-black blur-3xl -z-10" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg"
        >
          My Portfolio
        </motion.h1>

        {!user ? (
          <button
            onClick={login}
            className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 rounded-2xl shadow-xl hover:scale-110 hover:shadow-2xl transition"
          >
            Login
          </button>
        ) : (
          <div className="flex gap-4 items-center">
            <span className="text-sm opacity-70">{user.email}</span>
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
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl shadow-xl"
        >
          <h2 className="mb-4 text-xl font-semibold">Add Project</h2>

          <div className="grid md:grid-cols-2 gap-3">
            <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="p-2 rounded text-black" />
            <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="p-2 rounded text-black" />
            <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" className="p-2 rounded text-black" />
            <input name="github" value={form.github} onChange={handleChange} placeholder="GitHub" className="p-2 rounded text-black" />
            <input name="live" value={form.live} onChange={handleChange} placeholder="Live link" className="p-2 rounded text-black" />

            <button
              onClick={addProject}
              className="col-span-2 bg-gradient-to-r from-purple-500 to-pink-500 py-2 rounded-xl hover:scale-105 transition"
            >
              Add Project
            </button>
          </div>
        </motion.div>
      )}

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center text-lg animate-pulse opacity-60">
          Loading projects...
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {projects.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.06, rotateX: 3, rotateY: 3 }}
              className="group bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl hover:shadow-purple-500/30 transition"
            >
              <img
                src={p.image || "https://via.placeholder.com/400"}
                className="w-full h-52 object-cover group-hover:scale-110 transition duration-500"
              />

              <div className="p-5">
                <h2 className="text-xl font-bold mb-1">{p.title}</h2>
                <p className="text-sm opacity-70 mb-4">{p.description}</p>

                <div className="flex gap-2 flex-wrap">

                  <button
                    onClick={() => like(p._id)}
                    className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 rounded-xl shadow-lg hover:scale-110 hover:shadow-blue-500/40 transition"
                  >
                    👍 {p.likes?.length || 0}
                  </button>

                  <button
                    onClick={() => dislike(p._id)}
                    className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 rounded-xl shadow-lg hover:scale-110 hover:shadow-yellow-500/40 transition"
                  >
                    👎 {p.dislikes?.length || 0}
                  </button>

                  <a href={p.github} target="_blank">
                    <button className="bg-blue-700 px-3 py-1 rounded-xl hover:scale-105 transition">
                      GitHub
                    </button>
                  </a>

                  <a href={p.live} target="_blank">
                    <button className="bg-green-500 px-3 py-1 rounded-xl hover:scale-105 transition">
                      Live
                    </button>
                  </a>

                  {role === "admin" && (
                    <button
                      onClick={() => deleteProject(p._id)}
                      className="bg-red-500 px-3 py-1 rounded-xl hover:scale-105 transition"
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