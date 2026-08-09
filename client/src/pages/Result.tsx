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
import { useAuth, useUser } from "@clerk/react";
import api from "../config/axios";
import toast from "react-hot-toast";

const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Spanish', 'French', 'Arabic', 'Portuguese']

const Result = () => {
  const { projectId } = useParams();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const [project, setProjectData] = useState<Project>({} as Project);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [language, setLanguage] = useState('English');
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  const fetchProjectData = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/user/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const token = await getToken();
      const { data } = await api.post('/api/ai/generate-script', {
        productName: project.productName,
        productDescription: project.productDescription,
        userPrompt: project.userPrompt,
        language,
      }, { headers: { Authorization: `Bearer ${token}` } });

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
      const token = await getToken();

      // Save the script + language before kicking off video generation
      await api.patch(`/api/project/${projectId}/script`, { script, language }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data } = await api.post(
        "/api/project/video",
        { projectId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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

  //Fetch project every 10 seconds- to get the video
  useEffect(() => {
    if (user && isGenerating) {
      const interval = setInterval(() => {
        fetchProjectData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user, isGenerating]);

  return loading ? (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2Icon className="animate-spin text-indigo-400 size-9" />
    </div>
  ) : (
    <div className="min-h-screen text-white p-6 md:p-12 mt-20">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-medium">
            Generation Result
          </h1>
          <Link
            to="/generate"
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <p className="max-sm:hidden">New Generation</p>
          </Link>
        </header>

        {/* grid layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Result Display */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panal inline-block p-2 rounded-2xl">
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
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Download Buttons */}
            <div className="glass-panel p-6 rounded-2xl">
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
            </div>

            {/* Script + language, only relevant before video exists */}
            {!project.generatedVideo && (
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-xl font-semibold mb-4">Video Script</h3>

                <div className="mb-4">
                  <label htmlFor="language" className="block text-sm mb-2 text-gray-300">Language</label>
                  <select id="language" value={language} onChange={(e)=>setLanguage(e.target.value)}
                    className="w-full bg-white/3 rounded-lg border-2 p-3 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all">
                    {LANGUAGES.map(l => <option key={l} value={l} className="bg-neutral-900">{l}</option>)}
                  </select>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="script" className="text-sm text-gray-300">What the model will say</label>
                  <GhostButton type="button" onClick={handleGenerateScript} disabled={isGeneratingScript}
                    className="!px-3 !py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                    {isGeneratingScript ? <Loader2Icon className="size-3 animate-spin"/> : <SparklesIcon className="size-3"/>} Generate
                  </GhostButton>
                </div>
                <textarea id="script" rows={4} value={script}
                  onChange={(e)=>setScript(e.target.value)} placeholder="Click 'Generate' or write your own lines here."
                  className="w-full bg-white/3 rounded-lg border-2 p-3 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none resize-none transition-all"/>
              </div>
            )}

            {/* generate video button */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
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
                <PrimaryButton
                  onClick={handleGenerateVideo}
                  disabled={isGenerating}
                  className="w-full"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;