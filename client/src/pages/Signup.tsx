import { useState, useRef } from "react";
import type { FormEvent, MouseEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { SparklesIcon, ImageIcon, UserIcon, ArrowRightIcon, Loader2Icon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created!");
      navigate("/generate");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#08080b] px-4 py-16 overflow-hidden">
      {/* ambient glow field */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-[#4f39f6]/25 blur-[120px]"
          style={{ top: "-10%", left: "-10%" }}
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[420px] h-[420px] rounded-full bg-[#22d3ee]/15 blur-[110px]"
          style={{ bottom: "-10%", right: "-5%" }}
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative w-full max-w-4xl grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT — the generation pipeline, the actual thing this product does */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="hidden lg:flex flex-col gap-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#a5b4fc] bg-[#4f39f6]/10 border border-[#4f39f6]/30 rounded-full px-3 py-1 mb-6">
              <SparklesIcon className="size-3" />
              AI-generated ad creative
            </div>
            <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight">
              Two photos in.<br />One campaign out.
            </h1>
            <p className="text-gray-400 mt-4 max-w-sm">
              Upload a product and a model. UGC.ai fuses them into studio-grade
              imagery and video, automatically.
            </p>
          </div>

          {/* live pipeline visual */}
          <div className="relative h-40 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 160" fill="none">
              <motion.path
                d="M 60 50 C 130 50, 130 80, 160 80"
                stroke="#4f39f6"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1.2, delay: 0.3 }}
              />
              <motion.path
                d="M 60 110 C 130 110, 130 80, 160 80"
                stroke="#22d3ee"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1.2, delay: 0.5 }}
              />
              <motion.path
                d="M 160 80 C 200 80, 200 80, 260 80"
                stroke="white"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 0.8, delay: 1.1 }}
              />
            </svg>

            <motion.div
              className="absolute flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
              style={{ left: 20, top: 30, width: 60, height: 60 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ImageIcon className="size-6 text-[#a5b4fc]" />
            </motion.div>

            <motion.div
              className="absolute flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
              style={{ left: 20, top: 90, width: 60, height: 60 }}
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            >
              <UserIcon className="size-6 text-[#67e8f9]" />
            </motion.div>

            <motion.div
              className="absolute flex items-center justify-center rounded-2xl bg-[#4f39f6] shadow-[0_0_40px_-8px_#4f39f6]"
              style={{ left: 138, top: 58, width: 44, height: 44 }}
              animate={{ scale: [1, 1.08, 1], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <SparklesIcon className="size-5 text-white" />
            </motion.div>

            <motion.div
              className="absolute rounded-2xl overflow-hidden border border-white/10"
              style={{ left: 250, top: 45, width: 56, height: 70 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-[#4f39f6]/40 via-[#22d3ee]/20 to-transparent" />
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT — the form, 3D tilt + animated border */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
          style={{ perspective: 1000 }}
        >
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transformStyle: "preserve-3d",
              transition: "transform 0.15s ease-out",
            }}
            className="relative"
          >
            {/* animated gradient border */}
            <div className="absolute -inset-px rounded-2xl overflow-hidden">
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    "conic-gradient(from 0deg, #4f39f6, #22d3ee, transparent, #4f39f6)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative m-[1.5px] bg-[#0d0d12]/95 backdrop-blur-xl rounded-2xl p-8 space-y-5"
              style={{ transform: "translateZ(20px)" }}
            >
              <div>
                <h2 className="text-2xl font-semibold text-white">Create your account</h2>
                <p className="text-sm text-gray-500 mt-1">Start generating in under a minute.</p>
              </div>

              <div className="space-y-3">
                <div className="group relative">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] text-white text-sm placeholder:text-gray-600 border border-white/10 focus:outline-none focus:border-[#4f39f6]/60 focus:bg-white/[0.05] transition-all"
                    required
                  />
                </div>
                <div className="group relative">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] text-white text-sm placeholder:text-gray-600 border border-white/10 focus:outline-none focus:border-[#4f39f6]/60 focus:bg-white/[0.05] transition-all"
                    required
                  />
                </div>
                <div className="group relative">
                  <input
                    type="password"
                    placeholder="Password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] text-white text-sm placeholder:text-gray-600 border border-white/10 focus:outline-none focus:border-[#4f39f6]/60 focus:bg-white/[0.05] transition-all"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3 rounded-xl bg-[#4f39f6] text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_0_24px_-6px_#4f39f6] hover:shadow-[0_0_32px_-6px_#4f39f6] transition-shadow"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign up
                    <ArrowRightIcon className="size-4" />
                  </>
                )}
              </motion.button>

              <p className="text-sm text-gray-500 text-center pt-1">
                Already have an account?{" "}
                <Link to="/login" className="text-[#a5b4fc] hover:text-white transition-colors">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;