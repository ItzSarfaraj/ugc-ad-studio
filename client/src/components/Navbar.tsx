import {
  DollarSignIcon,
  FolderEditIcon,
  GalleryHorizontalEnd,
  MenuIcon,
  SparkleIcon,
  XIcon,
  LogOutIcon,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "./Buttons";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useAuth } from "../context/AuthContext";
import api from "../config/axios";
import toast from "react-hot-toast";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [credits, setCredits] = useState(0);
  const { pathname } = useLocation();

  const navLinks = [
    { name: "Home", href: "/#" },
    { name: "Create", href: "/generate" },
    { name: "My Generations", href: "/my-generations" },
    { name: "Community", href: "/community" },
    { name: "Plans", href: "/plans" },
  ];

  const getUserCredits = async () => {
    try {
      const { data } = await api.get("/api/user/credits");
      setCredits(data.credits);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error);
    }
  };

  useEffect(() => {
    if (user) {
      (async () => await getUserCredits())();
    }
  }, [user, pathname]);

  // close the user dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <motion.nav
      className="fixed top-5 left-0 right-0 z-50 px-4"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_8px_35px_rgba(0,0,0,0.35)]">
        {" "}
        <Link to="/" onClick={() => scrollTo(0, 0)}>
          <img src={assets.logo} alt="logo" className="h-8" />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/#" ? pathname === "/" : pathname === link.href;

            return (
              <Link
                onClick={() => scrollTo(0, 0)}
                to={link.href}
                key={link.name}
                className={`
                px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  isActive
                    ? "text-white bg-violet-500/15 shadow-[0_0_18px_rgba(139,92,246,0.12)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }
            `}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
        {!user ? (
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-gray-300 hover:text-white transition max-sm:hidden"
            >
              Sign in
            </button>
            <PrimaryButton
              onClick={() => navigate("/signup")}
              className="max-sm:text-xs hidden sm:inline-block"
            >
              Get Started
            </PrimaryButton>
          </div>
        ) : (
          <div className="flex gap-2">
            <GhostButton
              onClick={() => navigate("/plans")}
              className=" border border-violet-500/20 bg-white/5 text-gray-200 hover:bg-violet-500/10 hover:border-violet-500/40 hover:text-white transition-all duration-200 sm:py-1.5"
            >
              <SparkleIcon className="size-3.5 text-violet-400" />
              Credits: {credits}
            </GhostButton>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="group flex items-center justify-center"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className=" w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-violet-400/50 group-hover:scale-105 transition-all duration-200"
                  />
                ) : (
                  <div
                    className=" w-9 h-9 rounded-full flex items-center justify-center bg-violet-600/90 border border-violet-400/30 text-sm font-semibold text-white group-hover:bg-violet-500 group-hover:border-violet-300/60 group-hover:scale-105 transition-all duration-200"
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl py-2 shadow-lg">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/generate");
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <SparkleIcon size={14} /> Generate
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/my-generations");
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <FolderEditIcon size={14} /> My Generations
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/community");
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <GalleryHorizontalEnd size={14} /> Community
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/plans");
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <DollarSignIcon size={14} /> Plans
                  </button>

                  <div className="border-t border-white/10 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition"
                    >
                      <LogOutIcon size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {!user && (
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
            <MenuIcon className="size-6" />
          </button>
        )}
      </div>
      <div
        className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-black/40 backdrop-blur-md z-50 transition-all duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {navLinks.map((link) => (
          <a key={link.name} href={link.href} onClick={() => setIsOpen(false)}>
            {link.name}
          </a>
        ))}

        <button
          onClick={() => {
            setIsOpen(false);
            navigate("/login");
          }}
          className="font-medium text-gray-300 hover:text-white transition"
        >
          Sign in
        </button>
        <PrimaryButton
          onClick={() => {
            setIsOpen(false);
            navigate("/signup");
          }}
        >
          Get Started
        </PrimaryButton>

        <button
          onClick={() => setIsOpen(false)}
          className="rounded-md bg-white p-2 text-gray-800 ring-white active:ring-2"
        >
          <XIcon />
        </button>
      </div>
    </motion.nav>
  );
}
