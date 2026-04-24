import { useEffect, useState } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
} from "framer-motion";
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

  // CURSOR PHYSICS
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 25 });

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // AUTH
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
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative">

      {/* CINEMATIC BACKGROUND */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "radial-gradient(circle at 10% 20%, rgba(139,92,246,0.15), transparent 40%), radial-gradient(circle at 90% 80%, rgba(59,130,246,0.15), transparent 40%)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* CURSOR LIGHT */}
      <motion.div
        className="pointer-events-none fixed w-[600px] h-[600px] rounded-full blur-[200px] opacity-30"
        style={{
          left: springX,
          top: springY,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.6), transparent 70%)",
        }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center p-6">
        <motion.h1
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="text-6xl font-extrabold tracking-tight"
        >
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Portfolio
          </span>
        </motion.h1>

        {!user ? (
          <MagneticButton onClick={login}>Login</MagneticButton>
        ) : (
          <div className="flex gap-3 items-center">
            <span className="text-sm opacity-70">{user.email}</span>
            <MagneticButton onClick={logout}>Logout</MagneticButton>
          </div>
        )}
      </div>

      {/* ADMIN */}
      {role === "admin" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-6 mb-10 p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl"
        >
          <h2 className="mb-4 font-semibold">Admin Panel</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(form).map((k) => (
              <input
                key={k}
                name={k}
                value={form[k]}
                onChange={handleChange}
                placeholder={k}
                className="p-3 rounded-xl bg-white/10 focus:ring-2 focus:ring-purple-500"
              />
            ))}
          </div>

          <MagneticButton onClick={addProject}>
            Add Project
          </MagneticButton>
        </motion.div>
      )}

      {/* PROJECTS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 pb-10">
        {projects.map((p, i) => (
          <ProjectCard
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

/* ================= COMPONENTS ================= */

function MagneticButton({ children, onClick }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };

  return (
    <motion.button
      onMouseMove={handleMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="px-6 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition"
    >
      {children}
    </motion.button>
  );
}

function ProjectCard({ p, i, like, dislike, deleteProject, role }) {
  return (
    <Tilt glareEnable glareMaxOpacity={0.2}>
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.08, type: "spring" }}
        whileHover={{ y: -15 }}
        className="group bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden"
      >
        <img
          src={p.image || "https://via.placeholder.com/400"}
          className="w-full h-52 object-cover group-hover:scale-110 transition duration-500"
        />

        <div className="p-5">
          <h2 className="font-bold">{p.title}</h2>
          <p className="text-sm opacity-70">{p.description}</p>

          <div className="flex gap-2 mt-4 flex-wrap">
            <MagneticButton onClick={() => like(p._id)}>
              👍 {p.likes?.length || 0}
            </MagneticButton>

            <MagneticButton onClick={() => dislike(p._id)}>
              👎 {p.dislikes?.length || 0}
            </MagneticButton>

            <MagneticButton onClick={() => window.open(p.github)}>
              GitHub
            </MagneticButton>

            <MagneticButton onClick={() => window.open(p.live)}>
              Live
            </MagneticButton>

            {role === "admin" && (
              <MagneticButton onClick={() => deleteProject(p._id)}>
                Delete
              </MagneticButton>
            )}
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
}

export default App;