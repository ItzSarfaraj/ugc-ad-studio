import { useState, useRef } from "react";
import type { FormEvent, MouseEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { SparklesIcon, ArrowRightIcon, Loader2Icon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AVATAR_SEEDS = ["Aiden", "Priya", "Marcus", "Sofia", "Kenji"];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/generate");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#08080b] px-4 py-16 overflow-hidden">
      {/* ambient glow field */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute w-[620px] h-[620px] rounded-full bg-[#4f39f6]/20 blur-[150px]"
          style={{ top: "50%", left: "50%", translateX: "-50%", translateY: "-50%" }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-lg"
        style={{ perspective: 1000 }}
      >
        {/* floating mark above the card */}
        <motion.div
          className="mx-auto mb-7 flex items-center justify-center rounded-2xl bg-[#4f39f6]/10 border border-[#4f39f6]/30"
          style={{ width: 56, height: 56 }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <SparklesIcon className="size-6 text-[#a5b4fc]" />
        </motion.div>

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
          <div className="absolute -inset-px rounded-3xl overflow-hidden">
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
            className="relative m-[1.5px] bg-[#0d0d12]/95 backdrop-blur-xl rounded-3xl p-10 sm:p-12 space-y-7"
            style={{ transform: "translateZ(20px)" }}
          >
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
              <p className="text-base text-gray-500 mt-2">Log in to keep generating.</p>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl bg-white/[0.03] text-white text-sm placeholder:text-gray-600 border border-white/10 focus:outline-none focus:border-[#4f39f6]/60 focus:bg-white/[0.05] transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl bg-white/[0.03] text-white text-sm placeholder:text-gray-600 border border-white/10 focus:outline-none focus:border-[#4f39f6]/60 focus:bg-white/[0.05] transition-all"
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3.5 rounded-xl bg-[#4f39f6] text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_0_24px_-6px_#4f39f6] hover:shadow-[0_0_32px_-6px_#4f39f6] transition-shadow"
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log in
                  <ArrowRightIcon className="size-4" />
                </>
              )}
            </motion.button>

            {/* social proof — avatar stack */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <div className="flex -space-x-3">
                {AVATAR_SEEDS.map((seed) => (
                  <img
                    key={seed}
                    src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=4f39f6,22d3ee,1c1c1f`}
                    alt=""
                    className="size-8 rounded-full border-2 border-[#0d0d12] bg-[#1c1c1f]"
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Joined by <span className="text-gray-300 font-medium">12,000+</span> creators
              </p>
            </div>

            <p className="text-sm text-gray-500 text-center">
              No account?{" "}
              <Link to="/signup" className="text-[#a5b4fc] hover:text-white transition-colors">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;