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

    await axios.post(`${API}/projects`, form);
    setForm({ title: "", description: "", image: "", github: "", live: "" });
    fetchProjects();
  };

  const deleteProject = async (id) => {
    await axios.delete(`${API}/projects/${id}`);
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-blue-900/30 to-black blur-3xl -z-10" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-16">
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
          My Portfolio
        </h1>

        {!user ? (
          <button
            onClick={login}
            className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 rounded-2xl shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-300"
          >
            Login
          </button>
        ) : (
          <div className="flex items-center gap-4">
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
          className="mb-16 bg-white/5 border border-white/10 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl hover:shadow-purple-500/20 transition"
        >
          <h2 className="text-xl mb-4 font-semibold">Add Project</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input name="title" value={form.title} placeholder="Title" onChange={handleChange} className="p-2 rounded bg-white text-black" />
            <input name="description" value={form.description} placeholder="Description" onChange={handleChange} className="p-2 rounded bg-white text-black" />
            <input name="image" value={form.image} placeholder="Image URL" onChange={handleChange} className="p-2 rounded bg-white text-black" />
            <input name="github" value={form.github} placeholder="GitHub" onChange={handleChange} className="p-2 rounded bg-white text-black" />
            <input name="live" value={form.live} placeholder="Live link" onChange={handleChange} className="p-2 rounded bg-white text-black" />

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
        <p className="text-center opacity-50 text-lg animate-pulse">
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
              whileHover={{ scale: 1.06, rotateX: 2, rotateY: 2 }}
              className="group bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
            >
              <img
                src={p.image || "https://via.placeholder.com/400"}
                className="w-full h-52 object-cover group-hover:scale-110 transition duration-500"
              />

              <div className="p-5">
                <h2 className="text-xl font-bold mb-1">{p.title}</h2>
                <p className="text-sm opacity-70 mb-4">{p.description}</p>

                <div className="flex gap-2 flex-wrap">
                  <a href={p.github} target="_blank">
                    <button className="bg-blue-500 px-3 py-1 rounded-lg hover:bg-blue-600">
                      GitHub
                    </button>
                  </a>

                  <a href={p.live} target="_blank">
                    <button className="bg-green-500 px-3 py-1 rounded-lg hover:bg-green-600">
                      Live
                    </button>
                  </a>

                  {role === "admin" && (
                    <button
                      onClick={() => deleteProject(p._id)}
                      className="bg-red-500 px-3 py-1 rounded-lg hover:bg-red-600"
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