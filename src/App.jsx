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

  /* ───────────── GLOBAL CURSOR SYSTEM ───────────── */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const smx = useSpring(mx, { stiffness: 80, damping: 20 });
  const smy = useSpring(my, { stiffness: 80, damping: 20 });

  // velocity → влияет на glow
  const vx = useMotionValue(0);
  const vy = useMotionValue(0);

  useEffect(() => {
    let lx = 0, ly = 0;
    const move = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);

      vx.set(e.clientX - lx);
      vy.set(e.clientY - ly);

      lx = e.clientX;
      ly = e.clientY;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const glowScale = useTransform(vx, [-50, 0, 50], [1.2, 1, 1.2]);

  /* ───────────── AUTH ───────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);
      const res = await axios.post(`${API}/auth`, { email: u.email });
      setRole(res.data.role);
    });
    return () => unsub();
  }, []);

  /* ───────────── PROJECTS ───────────── */
  const fetchProjects = async () => {
    const res = await axios.get(`${API}/projects`);
    setProjects(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  /* ───────────── ACTIONS ───────────── */
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
    setForm({ title:"", description:"", image:"", github:"", live:"" });
    fetchProjects();
  };

  const deleteProject = async (id) => {
    await axios.delete(`${API}/projects/${id}`);
    fetchProjects();
  };

  const like = async (id) => {
    if (!user) return alert("Login first");
    await axios.post(`${API}/projects/${id}/like`, { userEmail: user.email });
    fetchProjects();
  };

  const dislike = async (id) => {
    if (!user) return alert("Login first");
    await axios.post(`${API}/projects/${id}/dislike`, { userEmail: user.email });
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-x-hidden">

      {/* 🌊 LIVE 3D BACKGROUND */}
      <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden">
        <Scene3D />
      </div>

      {/* 💎 GLASS OVERLAY (shader feel) */}
      <div className="fixed inset-0 -z-40 pointer-events-none backdrop-blur-[2px]
      bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.08),transparent_40%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.08),transparent_40%)]" />

      {/* 💡 GLOBAL LIGHT */}
      <motion.div
        className="pointer-events-none fixed w-[500px] h-[500px] rounded-full blur-[140px] opacity-30 mix-blend-screen -z-30"
        style={{
          left: smx,
          top: smy,
          scale: glowScale,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.35), rgba(59,130,246,0.25), transparent 70%)",
        }}
      />

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex justify-between items-center relative z-10">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Portfolio
        </h1>

        {!user ? (
          <Button onClick={login}>Login</Button>
        ) : (
          <div className="flex gap-3 items-center">
            <span className="text-xs text-gray-300">{user.email}</span>
            <Button onClick={logout}>Logout</Button>
          </div>
        )}
      </div>

      {/* ADMIN */}
      {role === "admin" && (
        <div className="max-w-6xl mx-auto px-6 mb-10 p-6 rounded-2xl
        bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-xl relative z-10">
          <div className="grid md:grid-cols-2 gap-3">
            {Object.keys(form).map((k) => (
              <input key={k} name={k} value={form[k]}
                onChange={handleChange} placeholder={k}
                className="p-2 rounded-lg bg-white/[0.06] border border-white/10 text-sm"/>
            ))}
          </div>
          <button onClick={addProject}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-sm">
            Add Project
          </button>
        </div>
      )}

      {/* PROJECTS */}
      <div className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse"/>
            ))
          : projects.map((p, i) => (
              <Card key={p._id} p={p} i={i}
                like={like} dislike={dislike}
                deleteProject={deleteProject} role={role}/>
            ))}
      </div>
    </div>
  );
}

/* ───────────── BUTTON ───────────── */
function Button({ children, onClick }) {
  return (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="px-5 py-2 rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-md">
      {children}
    </motion.button>
  );
}

/* ───────────── GOD CARD ───────────── */
function Card({ p, i, like, dislike, deleteProject, role }) {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);

  const sx = useSpring(x, { stiffness: 100, damping: 18 });
  const sy = useSpring(y, { stiffness: 100, damping: 18 });
  const srx = useSpring(rx, { stiffness: 140, damping: 18 });
  const sry = useSpring(ry, { stiffness: 140, damping: 18 });

  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - r.left - r.width/2;
    const dy = e.clientY - r.top - r.height/2;

    const dist = Math.sqrt(dx*dx + dy*dy);
    const max = Math.max(r.width, r.height)/2;
    const strength = 1 - Math.min(dist/max,1);

    x.set(dx * 0.2 * strength);
    y.set(dy * 0.2 * strength);

    ry.set(dx/16);
    rx.set(-dy/16);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={()=>{x.set(0);y.set(0);rx.set(0);ry.set(0);}}
      style={{ x:sx, y:sy, rotateX:srx, rotateY:sry, transformPerspective:1200 }}
      whileHover={{ scale:1.05 }}
      className="group relative rounded-2xl overflow-hidden bg-white/[0.05] border border-white/10 shadow-xl"
    >
      {/* light */}
      <motion.div
        className="pointer-events-none absolute w-[300px] h-[300px] blur-2xl opacity-0 group-hover:opacity-100"
        style={{
          left:sx, top:sy,
          transform:"translate(-50%,-50%)",
          background:"radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)"
        }}
      />

      <img src={p.image} className="w-full h-48 object-cover" />

      <div className="p-4">
        <h2>{p.title}</h2>
        <p className="text-xs text-gray-400">{p.description}</p>

        <div className="flex gap-2 mt-4 flex-wrap">
          <MiniButton onClick={()=>like(p._id)}>👍 {p.likes?.length||0}</MiniButton>
          <MiniButton onClick={()=>dislike(p._id)}>👎 {p.dislikes?.length||0}</MiniButton>
          <MiniButton onClick={()=>window.open(p.github)}>GitHub</MiniButton>
          <MiniButton onClick={()=>window.open(p.live)}>Live</MiniButton>
          {role==="admin" && (
            <MiniButton danger onClick={()=>deleteProject(p._id)}>Delete</MiniButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MiniButton({ children, onClick, danger }) {
  return (
    <button onClick={onClick}
      className={`px-2 py-1 text-xs rounded ${
        danger ? "bg-red-500/20" : "bg-white/[0.1]"
      }`}>
      {children}
    </button>
  );
}