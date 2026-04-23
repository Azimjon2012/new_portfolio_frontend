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
    <div className="min-h-screen bg-black text-white px-6 py-10 relative">

      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-blue-900/30 to-black blur-3xl -z-10" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-16">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          My Portfolio
        </h1>

        {!user ? (
          <button onClick={login} className="bg-blue-500 px-5 py-2 rounded-xl">
            Login
          </button>
        ) : (
          <div className="flex gap-4 items-center">
            <span className="text-sm opacity-70">{user.email}</span>
            <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ADMIN */}
      {role === "admin" && (
        <div className="mb-10 bg-white/10 p-6 rounded-2xl">
          <h2 className="mb-4 text-xl">Add Project</h2>

          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="block p-2 text-black mb-2 w-full"/>
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="block p-2 text-black mb-2 w-full"/>
          <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" className="block p-2 text-black mb-2 w-full"/>
          <input name="github" value={form.github} onChange={handleChange} placeholder="GitHub" className="block p-2 text-black mb-2 w-full"/>
          <input name="live" value={form.live} onChange={handleChange} placeholder="Live link" className="block p-2 text-black mb-2 w-full"/>

          <button onClick={addProject} className="bg-purple-500 px-4 py-2 rounded">
            Add Project
          </button>
        </div>
      )}

      {/* PROJECTS */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((p) => (
            <motion.div
              key={p._id}
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 rounded-2xl overflow-hidden"
            >
              <img src={p.image} className="w-full h-48 object-cover" />

              <div className="p-4">
                <h2 className="text-lg font-bold">{p.title}</h2>
                <p className="text-sm opacity-70">{p.description}</p>

                <div className="flex gap-2 flex-wrap mt-4">

                  <button
                    onClick={() => like(p._id)}
                    className="bg-blue-500 px-3 py-1 rounded"
                  >
                    👍 {p.likes?.length || 0}
                  </button>

                  <button
                    onClick={() => dislike(p._id)}
                    className="bg-yellow-500 px-3 py-1 rounded"
                  >
                    👎 {p.dislikes?.length || 0}
                  </button>

                  <a href={p.github} target="_blank">
                    <button className="bg-blue-700 px-3 py-1 rounded">
                      GitHub
                    </button>
                  </a>

                  <a href={p.live} target="_blank">
                    <button className="bg-green-500 px-3 py-1 rounded">
                      Live
                    </button>
                  </a>

                  {role === "admin" && (
                    <button
                      onClick={() => deleteProject(p._id)}
                      className="bg-red-500 px-3 py-1 rounded"
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