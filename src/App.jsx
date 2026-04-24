import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Tilt from "react-parallax-tilt";
import ShaderBackground from "./ShaderBackground";
import ParticleCanvas from "./Particles";

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

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const res = await axios.post(`${API}/auth`, {
          email: u.email,
        });
        setRole(res.data.role);
      }
    });
    return () => unsub();
  }, []);

  // projects
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
    setForm({
      title: "",
      description: "",
      image: "",
      github: "",
      live: "",
    });
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
    <div className="min-h-screen text-white relative overflow-x-hidden">

      {/* BASE */}
      <div className="absolute inset-0 -z-30 bg-[#050505]" />

      {/* animated gradient */}
      <div className="absolute inset-0 -z-20 opacity-30 animate-pulse bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20" />

      {/* glow blobs */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-purple-500/20 blur-[180px] rounded-full -z-20" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-blue-500/20 blur-[180px] rounded-full -z-20" />

      <ShaderBackground />
      <div className="absolute inset-0 -z-10 opacity-25">
        <ParticleCanvas />
      </div>

      {/* header */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex justify-between items-center">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Portfolio
        </h1>

        {!user ? (
          <Button onClick={login}>Login</Button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-300">{user.email}</span>
            <Button onClick={logout}>Logout</Button>
          </div>
        )}
      </div>

      {/* ADMIN */}
      {role === "admin" && (
        <div className="max-w-6xl mx-auto px-6 mb-12 p-6 rounded-2xl
        bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-xl">
          <h2 className="text-sm mb-4 text-gray-300">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-2 rounded-lg bg-white/[0.07] border border-white/10 text-sm outline-none focus:border-purple-400"
              />
            ))}
          </div>

          <button
            onClick={addProject}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-sm"
          >
            Add Project
          </button>
        </div>
      )}

      {/* PROJECTS */}
      <div className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl"/>
            ))
          : projects.map((p, i) => (
              <Card
                key={p._id}
                p={p}
                i={i}
                like={like}
                dislike={dislike}
                deleteProject={deleteProject}
                role={role}
              />
            ))}
      </div>
    </div>
  );
}

/* BUTTON */
function Button({ children, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 250 }}
      onClick={onClick}
      className="px-5 py-2 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md hover:bg-white/[0.15]"
    >
      {children}
    </motion.button>
  );
}

/* CARD with spotlight */
function Card({ p, i, like, dislike, deleteProject, role }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const smoothX = useSpring(x, { stiffness: 120, damping: 20 });
  const smoothY = useSpring(y, { stiffness: 120, damping: 20 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  return (
    <Tilt tiltMaxAngleX={6} tiltMaxAngleY={6} scale={1.03}>
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        whileHover={{ y: -8 }}
        className="group relative rounded-2xl overflow-hidden
        bg-white/[0.06]
        backdrop-blur-xl
        border border-white/10
        shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
      >
        {/* spotlight */}
        <motion.div
          className="pointer-events-none absolute w-[300px] h-[300px] rounded-full blur-2xl opacity-0 group-hover:opacity-100"
          style={{
            left: smoothX,
            top: smoothY,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)",
          }}
        />

        <img
          src={p.image}
          className="w-full h-48 object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="p-4">
          <h2 className="text-base font-semibold">{p.title}</h2>
          <p className="text-xs text-gray-400 mt-1">{p.description}</p>

          <div className="flex gap-2 mt-4 flex-wrap">
            <MiniButton onClick={() => like(p._id)}>
              👍 {p.likes?.length || 0}
            </MiniButton>

            <MiniButton onClick={() => dislike(p._id)}>
              👎 {p.dislikes?.length || 0}
            </MiniButton>

            <MiniButton onClick={() => window.open(p.github)}>
              GitHub
            </MiniButton>

            <MiniButton onClick={() => window.open(p.live)}>
              Live
            </MiniButton>

            {role === "admin" && (
              <MiniButton danger onClick={() => deleteProject(p._id)}>
                Delete
              </MiniButton>
            )}
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
}

/* MINI BUTTON */
function MiniButton({ children, onClick, danger }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`px-2 py-1 rounded-md text-xs ${
        danger
          ? "bg-red-500/20 hover:bg-red-500/40"
          : "bg-white/[0.1] hover:bg-white/[0.2]"
      }`}
    >
      {children}
    </motion.button>
  );
}

export default App;