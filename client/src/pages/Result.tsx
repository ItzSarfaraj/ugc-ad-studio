import { useEffect, useState } from "react";
import type { Project } from "../types";
import {
  ImageIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparkleIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GhostButton, PrimaryButton } from "../components/Buttons";
import { useAuth } from "../context/AuthContext";
import api from "../config/axios";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "framer-motion";
import { NeuralBackground, AmbientGlow, StudioKicker, TiltPanel, GlowField } from "../components/StudioFX";

const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Spanish', 'French', 'Arabic', 'Portuguese']

const Result = () => {
  const { projectId } = useParams();
  const { user, isLoaded } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [project, setProjectData] = useState<Project>({} as Project);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [language, setLanguage] = useState('English');
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fetchProjectData = async () => {
    try {
      const { data } = await api.get(`/api/user/projects/${projectId}`);
      setProjectData(data.project);
      setIsGenerating(data.project.isGenerating);
      setLanguage(data.project.language || 'English');
      setScript(data.project.script || '');
      setLoading(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load project");
      console.log(error);
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleGenerateScript = async () => {
    try {
      setIsGeneratingScript(true);
      const { data } = await api.post('/api/ai/generate-script', {
        productName: project.productName,
        productDescription: project.productDescription,
        userPrompt: project.userPrompt,
        language,
      });

      setScript(data.script);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    try {
      await api.patch(`/api/project/${projectId}/script`, { script, language });

      const { data } = await api.post("/api/project/video", { projectId });
      setProjectData((prev) => ({
        ...prev,
        generatedVideo: data.videoUrl,
        isGenerating: false,
        error: undefined,
      }));
      setIsGenerating(false);
      toast.success(data.message);
    } catch (error: any) {
      setIsGenerating(false);

      const message =
        error?.response?.data?.message ||
        "Video generation failed. Please try again.";

      setProjectData((prev) => ({
        ...prev,
        isGenerating: false,
        error: message,
      }));

      toast.error(message);
      console.error("Video generation error:", error);
    }
  };

  useEffect(() => {
    if (user && !project.id) {
      fetchProjectData();
    } else if (isLoaded && !user) {
      navigate("/");
    }
  }, [user]);

  useEffect(() => {
    if (user && isGenerating) {
      const interval = setInterval(() => {
        fetchProjectData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user, isGenerating]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0 },
  }

  const fieldBase = "w-full bg-transparent p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none resize-none transition-all"

  return loading ? (
    <div className="h-screen w-full flex items-center justify-center relative">
      <NeuralBackground />
      <Loader2Icon className="animate-spin text-indigo-400 size-9" />
    </div>
  ) : (
    <div className="min-h-screen relative text-white p-6 md:p-12 mt-20 overflow-hidden">
      <NeuralBackground />
      <AmbientGlow />

      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.08 }}
      >
        <motion.header variants={sectionVariants} transition={{ duration: 0.5 }} className="flex justify-between items-center mb-8">
          <div>
            <StudioKicker label={project.name || "AI compositing studio"} />
            <h1 className="text-2xl md:text-3xl font-medium">
              Generation Result
            </h1>
          </div>
          <Link
            to="/generate"
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <p className="max-sm:hidden">New Generation</p>
          </Link>
        </motion.header>

        {/* grid layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Result Display */}
          <motion.div variants={sectionVariants} transition={{ duration: 0.5 }} className="lg:col-span-2 space-y-6">
            <div className="studio-panel inline-block p-2 relative overflow-hidden">
              {isGenerating && (
                <motion.div
                  className="absolute inset-0 opacity-30 z-10 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, transparent, #4f39f6, transparent)" }}
                  animate={reduceMotion ? {} : { y: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              <div
                className={`${project.aspectRatio === "9:16" ? "aspect-9/16" : "aspect-video"} 
                   sm:max-h-200 rounded-xl bg-gray-900 overflow-hidden relative`}
              >
                {project?.generatedVideo ? (
                  <video
                    src={project.generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={project.generatedImage}
                    alt="Generated Result"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Download Buttons */}
            <motion.div variants={sectionVariants} transition={{ duration: 0.5 }}>
              <TiltPanel className="studio-panel p-6">
                <h3 className="text-xl font-semibold mb-4">Actions</h3>
                <div className="flex flex-col gap-3">
                  <a href={project.generatedImage} download>
                    <GhostButton
                      disabled={!project.generatedImage}
                      className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ImageIcon className="size-4.5" />
                      Download Image
                    </GhostButton>
                  </a>
                  <a href={project.generatedVideo} download>
                    <GhostButton
                      disabled={!project.generatedVideo}
                      className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <VideoIcon className="size-4.5" />
                      Download Video
                    </GhostButton>
                  </a>
                </div>
              </TiltPanel>
            </motion.div>

            {/* Script + language, only relevant before video exists */}
            {!project.generatedVideo && (
              <motion.div variants={sectionVariants} transition={{ duration: 0.5 }}>
                <TiltPanel className="studio-panel p-6">
                  <h3 className="text-xl font-semibold mb-4">Video Script</h3>

                  <div className="mb-4">
                    <label htmlFor="language" className="block text-sm mb-2 text-gray-300">Language</label>
                    <GlowField focused={focusedField === "language"}>
                      <select id="language" value={language} onChange={(e)=>setLanguage(e.target.value)}
                        onFocus={()=>setFocusedField("language")} onBlur={()=>setFocusedField(null)}
                        className={fieldBase}>
                        {LANGUAGES.map(l => <option key={l} value={l} className="bg-neutral-900">{l}</option>)}
                      </select>
                    </GlowField>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="script" className="text-sm text-gray-300">What the model will say</label>
                    <GhostButton type="button" onClick={handleGenerateScript} disabled={isGeneratingScript}
                      className="!px-3 !py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                      {isGeneratingScript ? <Loader2Icon className="size-3 animate-spin"/> : <SparklesIcon className="size-3"/>} Generate
                    </GhostButton>
                  </div>
                  <GlowField focused={focusedField === "script"}>
                    <textarea id="script" rows={4} value={script}
                      onChange={(e)=>setScript(e.target.value)}
                      onFocus={()=>setFocusedField("script")} onBlur={()=>setFocusedField(null)}
                      placeholder="Click 'Generate' or write your own lines here."
                      className={fieldBase}/>
                  </GlowField>
                </TiltPanel>
              </motion.div>
            )}

            {/* generate video button */}
            <motion.div variants={sectionVariants} transition={{ duration: 0.5 }}>
              <TiltPanel disabled className="studio-panel p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <VideoIcon className="size-24" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Video Magic</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Turn this static image into dynamic video for social media
                </p>
                {project.error && !project.generatedVideo && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {project.error}
                  </div>
                )}

                {!project.generatedVideo ? (
                  <motion.div
                    whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                    whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                  >
                    <PrimaryButton
                      onClick={handleGenerateVideo}
                      disabled={isGenerating}
                      className="w-full shadow-[0_0_24px_-8px_#4f39f6]"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2Icon className="size-4 animate-spin" />
                          Generating Video...
                        </>
                      ) : (
                        <>
                          <SparkleIcon className="size-4" />
                          Generate Video
                        </>
                      )}
                    </PrimaryButton>
                  </motion.div>
                ) : (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-center text-sm font-medium">
                    Video Generated Successfully
                  </div>
                )}
                {isGenerating && (
                  <p className="text-gray-400 text-xs mt-3 text-center">
                    AI is creating your video. This may take a few minutes.
                  </p>
                )}
              </TiltPanel>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Result;