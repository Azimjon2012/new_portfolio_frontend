import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Scene3D from "./Scene3D";

const API = "https://new-portfolio-backend-11l0.onrender.com";

export default function App() {
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

  // cursor system
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const smx = useSpring(mx, { stiffness: 80, damping: 20 });
  const smy = useSpring(my, { stiffness: 80, damping: 20 });

  const vx = useMotionValue(0);
  const glowScale = useTransform(vx, [-50, 0, 50], [1.2, 1, 1.2]);

  useEffect(() => {
    let lx = 0;
    const move = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      vx.set(e.clientX - lx);
      lx = e.clientX;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);
      const res = await axios.post(`${API}/auth`, { email: u.email });
      setRole(res.data.role);
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
    await axios.post(`${API}/projects`, form);
    fetchProjects();
  };

  const deleteProject = async (id) => {
    await axios.delete(`${API}/projects/${id}`);
    fetchProjects();
  };

  const like = async (id) => {
    await axios.post(`${API}/projects/${id}/like`, {
      userEmail: user.email,
    });
    fetchProjects();
  };

  const dislike = async (id) => {
    await axios.post(`${API}/projects/${id}/dislike`, {
      userEmail: user.email,
    });
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden">

      {/* 3D background */}
      <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden">
        <Scene3D />
      </div>

      {/* glass layer */}
      <div className="fixed inset-0 -z-40 pointer-events-none backdrop-blur-[2px]" />

      {/* global light */}
      <motion.div
        className="pointer-events-none fixed w-[500px] h-[500px] rounded-full blur-[140px] opacity-40 mix-blend-screen"
        style={{
          left: smx,
          top: smy,
          scale: glowScale,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.6), rgba(59,130,246,0.4), transparent 70%)",
        }}
      />

      {/* header */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex justify-between">
        <h1 className="text-5xl font-bold">Portfolio</h1>
        {!user ? (
          <button onClick={login}>Login</button>
        ) : (
          <button onClick={logout}>Logout</button>
        )}
      </div>

      {/* admin */}
      {role === "admin" && (
        <div className="max-w-6xl mx-auto p-6">
          {Object.keys(form).map((k) => (
            <input
              key={k}
              name={k}
              value={form[k]}
              onChange={handleChange}
              placeholder={k}
            />
          ))}
          <button onClick={addProject}>Add</button>
        </div>
      )}

      {/* projects */}
      <div className="grid md:grid-cols-3 gap-6 px-6">
        {projects.map((p, i) => (
          <Card
            key={p._id}
            p={p}
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

/* CARD */
function Card({ p, like, dislike, deleteProject, role }) {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const sx = useSpring(x, { stiffness: 100, damping: 18 });
  const sy = useSpring(y, { stiffness: 100, damping: 18 });

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - r.left - r.width / 2;
    const dy = e.clientY - r.top - r.height / 2;

    x.set(dx * 0.3);
    y.set(dy * 0.3);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: sx, y: sy }}
      whileHover={{ scale: 1.08 }}
      className="rounded-2xl overflow-hidden bg-white/[0.05] border"
    >
      <img src={p.image} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h2>{p.title}</h2>
        <button onClick={() => like(p._id)}>👍</button>
        <button onClick={() => dislike(p._id)}>👎</button>
        {role === "admin" && (
          <button onClick={() => deleteProject(p._id)}>Delete</button>
        )}
      </div>
    </motion.div>
  );
} 