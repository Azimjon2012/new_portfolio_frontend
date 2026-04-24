import { useEffect, useState } from "react";
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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 18 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 18 });

  // global cursor tracking
  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

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
    <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden">

      {/* background */}
      <ShaderBackground />

      <div className="absolute inset-0 -z-20 opacity-50">
        <ParticleCanvas />
      </div>

      {/* GLOBAL LIGHT */}
      <motion.div
        className="pointer-events-none fixed w-[900px] h-[900px] rounded-full blur-[250px] opacity-50 mix-blend-screen"
        style={{
          left: smoothX,
          top: smoothY,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.45), rgba(59,130,246,0.35), transparent 70%)",
        }}
      />

      {/* header */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Portfolio
        </h1>

        {!user ? (
          <Button onClick={login}>Login</Button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{user.email}</span>
            <Button onClick={logout}>Logout</Button>
          </div>
        )}
      </div>

      {/* admin */}
      {role === "admin" && (
        <div className="max-w-7xl mx-auto px-6 mb-10 p-6 rounded-2xl
        bg-white/[0.06] backdrop-blur-2xl border border-white/10
        shadow-[0_0_80px_rgba(139,92,246,0.2)]">
          <h2 className="text-sm mb-4 text-gray-300">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-2 rounded-lg bg-white/[0.08] border border-white/10 text-sm outline-none focus:border-purple-400"
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

      {/* projects */}
      <div className="max-w-7xl mx-auto px-6 pb-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={onClick}
      className="px-5 py-2 rounded-xl
      bg-white/[0.08] backdrop-blur-xl
      border border-white/10
      shadow-[0_0_20px_rgba(139,92,246,0.2)]
      hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]"
    >
      {children}
    </motion.button>
  );
}

/* CARD */
function Card({ p, i, like, dislike, deleteProject, role }) {
  return (
    <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        whileHover={{ y: -12 }}
        className="group relative rounded-2xl overflow-hidden
        bg-white/[0.08]
        backdrop-blur-2xl
        border border-white/10
        shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* dynamic light inside card */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500
        bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 blur-2xl"/>

        <img
          src={p.image}
          className="w-full h-52 object-cover transition duration-700 group-hover:scale-110"
        />

        <div className="p-5">
          <h2 className="text-lg font-semibold">{p.title}</h2>
          <p className="text-sm text-gray-400">{p.description}</p>

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
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-sm ${
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