import  { useState, useRef, useEffect } from "react"
import type {  MouseEvent as ReactMouseEvent } from "react"
import Title from "../components/Title"
import UploadZone from "../components/UploadZone"
import { Loader2Icon, RectangleHorizontalIcon, RectangleVerticalIcon, SparklesIcon, Wand2Icon } from "lucide-react"
import { PrimaryButton, GhostButton } from "../components/Buttons"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../config/axios"
import { motion, useReducedMotion } from "framer-motion"
import { NeuralBackground, AmbientGlow, StudioKicker, TiltPanel, GlowField } from "../components/StudioFX"

// ---------- Composite Stage — live preview of product + model fusing (page-specific, stays here) ----------
const CompositeStage = ({ productImage, modelImage }: { productImage: File | null; modelImage: File | null }) => {
  const [productUrl, setProductUrl] = useState<string | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!productImage) { setProductUrl(null); return }
    const url = URL.createObjectURL(productImage)
    setProductUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [productImage])

  useEffect(() => {
    if (!modelImage) { setModelUrl(null); return }
    const url = URL.createObjectURL(modelImage)
    setModelUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [modelImage])

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return
    const el = stageRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -6, y: px * 8 })
  }

  const bothReady = productUrl && modelUrl

  if (!productUrl && !modelUrl) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-2"
    >
      <div
        ref={stageRef}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{ perspective: 1400 }}
        className="relative h-36 sm:h-44 flex items-center justify-center"
      >
        {bothReady && (
          <motion.div
            className="absolute h-px w-36 sm:w-52"
            style={{ background: "linear-gradient(90deg, transparent, #4f39f6, #22d3ee, transparent)" }}
            animate={reduceMotion ? {} : { opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <motion.div
          style={{
            transform: reduceMotion ? undefined : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform 0.2s ease-out",
          }}
          className="flex items-center gap-4 sm:gap-7"
        >
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative w-18 h-24 sm:w-22 sm:h-28 rounded-lg overflow-hidden border border-white/10 bg-white/5 shadow-[0_18px_36px_-14px_rgba(79,57,246,0.55)]"
            style={{ transform: "translateZ(28px)" }}
          >
            <img src={productUrl!} className="w-full h-full object-cover" alt="Product preview" />
            <span className="absolute bottom-1 left-1.5 text-[9px] uppercase tracking-wider text-white/70">Product</span>
          </motion.div>

          <div className="relative z-10 w-5 flex items-center justify-center">
            {bothReady ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <SparklesIcon className="size-4 text-[#a5b4fc]" />
              </motion.div>
            ) : (
              <span className="text-[10px] text-gray-600">+</span>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: modelUrl ? 1 : 0.15, x: 0 }}
            className="relative w-18 h-24 sm:w-22 sm:h-28 rounded-lg overflow-hidden border border-white/10 bg-white/5 shadow-[0_18px_36px_-14px_rgba(34,211,238,0.45)]"
            style={{ transform: "translateZ(28px)" }}
          >
            {modelUrl && <img src={modelUrl} className="w-full h-full object-cover" alt="Model preview" />}
            <span className="absolute bottom-1 left-1.5 text-[9px] uppercase tracking-wider text-white/70">Model</span>
          </motion.div>
        </motion.div>
      </div>

      <p className="text-center text-xs text-gray-500 -mt-1">
        {bothReady ? "Ready to compose — Generate when you're set." : "Waiting on the second photo to preview the fusion."}
      </p>
    </motion.div>
  )
}

const Generator = () => {

  const {user} = useAuth();
  const navigate = useNavigate();

  const[name, setName] = useState('')
  const[productName, setProductName] = useState('')
  const[productDescription, setProductDescription] = useState('')
  const[aspectRatio, setAspectRatio] = useState('9:16')
  const[productImage, setProductImage] = useState<File | null>(null)
  const[modelImage, setModelImage] = useState<File | null>(null)
  const[userPrompt, setUserPrompt] = useState('')
  const[isGenerating, setIsGenerating] = useState(false)
  const[isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const[focusedField, setFocusedField] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type:'product' | 'model')=>{
    if(e.target.files && e.target.files[0]){
      if(type === 'product') setProductImage(e.target.files[0]);
      else setModelImage(e.target.files[0]);
    }
  }

  const handleGeneratePrompt = async () => {
    if(!user){return toast('Please login to use AI tools')}
    if(!productName){return toast('Enter a product name first')}

    try{
      setIsGeneratingPrompt(true)
      const {data} = await api.post('/api/ai/generate-prompt', {
        productName, productDescription, idea: userPrompt
      })

      setUserPrompt(data.prompt)
    }catch(error:any){
      toast.error(error?.response?.data?.message || error.message)
    }finally{
      setIsGeneratingPrompt(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    if(!user){return toast('Please login to generate')}
    if(!productImage || !modelImage || !name || !productName || !aspectRatio){return toast('Please fill all the required fields')}

    try{
      setIsGenerating(true);
      const formData = new FormData();
      formData.append('name',name)
      formData.append('productName',productName)
      formData.append('productDescription',productDescription)
      formData.append('userPrompt',userPrompt)
      formData.append('aspectRatio',aspectRatio)
      formData.append('images',productImage)
      formData.append('images',modelImage)

      const {data} = await api.post('/api/project/create',formData)

      toast.success(data.message)
      navigate('/result/' + data.projectId)
      

    }catch(error:any){
     setIsGenerating(false);
     toast.error(error?.response?.data?.message || error.message);
    }
  }

  const ASPECT_OPTIONS = [
    { value: '9:16', icon: RectangleVerticalIcon, label: 'Vertical', hint: 'Reels · Shorts · TikTok' },
    { value: '16:9', icon: RectangleHorizontalIcon, label: 'Horizontal', hint: 'YouTube · Landscape' },
  ]

  const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0 },
  }

  const fieldBase = "w-full bg-transparent p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none resize-none transition-all"

  return (
    <div className="min-h-screen relative text-white p-6 md:p-12 mt-28 overflow-hidden">

      <NeuralBackground />
      <AmbientGlow />

      <motion.form
        onSubmit={handleGenerate}
        className="max-w-4xl mx-auto mb-40"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.08 }}
      >
        <motion.div variants={sectionVariants} transition={{ duration: 0.5 }}>
          <StudioKicker label="AI compositing studio" />
          <Title heading='Create In-Context Image' description="Upload your modal and product images to generate 
          stunning UGC, short-form videos and social media posts"/>
        </motion.div>

        {/* Section 01 — Images */}
        <motion.div variants={sectionVariants} transition={{ duration: 0.5 }} className="mt-10">
          <TiltPanel disabled className="studio-panel p-6 md:p-8">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-xs font-mono text-[#a5b4fc]">01</span>
              <h3 className="text-lg font-semibold">Upload images</h3>
            </div>

            <CompositeStage productImage={productImage} modelImage={modelImage} />

            <div className="grid sm:grid-cols-2 gap-6">
              <UploadZone label="Product Image" file={productImage} onClear={()=>setProductImage(null)} onChange={(e)=>handleFileChange(e,'product')}/>
              <UploadZone label="Model Image" file={modelImage} onClear={()=>setModelImage(null)} onChange={(e)=>handleFileChange(e,'model')}/>
            </div>
          </TiltPanel>
        </motion.div>

        {/* Section 02 — Product Details */}
        <motion.div variants={sectionVariants} transition={{ duration: 0.5 }} className="mt-6">
          <TiltPanel className="studio-panel p-6 md:p-8">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-xs font-mono text-[#a5b4fc]">02</span>
              <h3 className="text-lg font-semibold">Product details</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="text-gray-300">
                 <label htmlFor="name" className="block text-sm mb-2">Project name</label>
                 <GlowField focused={focusedField === "name"}>
                   <input type='text' id="name" value={name} onChange={(e)=>setName(e.target.value)}
                     onFocus={()=>setFocusedField("name")} onBlur={()=>setFocusedField(null)}
                     placeholder="Name your project" required className={fieldBase}/>
                 </GlowField>
              </div>

              <div className="text-gray-300">
                 <label htmlFor="productName" className="block text-sm mb-2">Product name</label>
                 <GlowField focused={focusedField === "productName"}>
                   <input type='text' id="productName" value={productName} onChange={(e)=>setProductName(e.target.value)}
                     onFocus={()=>setFocusedField("productName")} onBlur={()=>setFocusedField(null)}
                     placeholder="Enter the name of the product" required className={fieldBase}/>
                 </GlowField>
              </div>
            </div>

            <div className="mt-6 text-gray-300">
               <label htmlFor="productDescription" className="block text-sm mb-2">Product description <span className="text-xs text-[#a5b4fc]">(optional)</span></label>
               <GlowField focused={focusedField === "productDescription"}>
                 <textarea id="productDescription" rows={3} value={productDescription}
                     onChange={(e)=>setProductDescription(e.target.value)}
                     onFocus={()=>setFocusedField("productDescription")} onBlur={()=>setFocusedField(null)}
                     placeholder="Enter the description of the product" className={fieldBase}/>
               </GlowField>
            </div>
          </TiltPanel>
        </motion.div>

        {/* Section 03 — Style & Direction */}
        <motion.div variants={sectionVariants} transition={{ duration: 0.5 }} className="mt-6">
          <TiltPanel className="studio-panel p-6 md:p-8">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-xs font-mono text-[#a5b4fc]">03</span>
              <h3 className="text-lg font-semibold">Style & direction</h3>
            </div>

            <div className="text-gray-300">
              <label className="block text-sm mb-3">Aspect ratio</label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {ASPECT_OPTIONS.map(({value, icon: Icon, label, hint}) => {
                  const active = aspectRatio === value;
                  return (
                    <motion.button
                      type="button"
                      key={value}
                      onClick={()=>setAspectRatio(value)}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer overflow-hidden
                        ${active ? 'border-[#4f39f6]/60 bg-[#4f39f6]/10' : 'border-white/10 bg-white/[0.03] hover:border-[#4f39f6]/30'}`}
                    >
                      {active && (
                        <motion.div
                          layoutId="aspect-glow"
                          className="absolute inset-0 shadow-[0_0_24px_-4px_#4f39f6] pointer-events-none"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon className={`size-6 shrink-0 relative z-10 ${active ? 'text-[#a5b4fc]' : 'text-violet-300/70'}`}/>
                      <span className="min-w-0 relative z-10">
                        <span className="block text-sm font-medium">{label}</span>
                        <span className="block text-xs text-gray-400 truncate">{hint}</span>
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 text-gray-300">
               <div className="flex items-center justify-between mb-2">
                 <label htmlFor="userPrompt" className="text-sm">User prompt <span className="text-xs text-[#a5b4fc]">(optional)</span></label>
                 <GhostButton type="button" onClick={handleGeneratePrompt} disabled={isGeneratingPrompt}
                   className="!px-3 !py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                   {isGeneratingPrompt ? <Loader2Icon className="size-3 animate-spin"/> : <SparklesIcon className="size-3"/>} Generate prompt
                 </GhostButton>
               </div>
               <GlowField focused={focusedField === "userPrompt"}>
                 <textarea id="userPrompt" rows={4} value={userPrompt}
                     onChange={(e)=>setUserPrompt(e.target.value)}
                     onFocus={()=>setFocusedField("userPrompt")} onBlur={()=>setFocusedField(null)}
                     placeholder="Describe how you want the narration to be, or click Generate Prompt." className={fieldBase}/>
               </GlowField>
            </div>
          </TiltPanel>
        </motion.div>

        {/* Generate bar */}
        <motion.div variants={sectionVariants} transition={{ duration: 0.5 }} className="mt-6">
          <div className="studio-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
            {isGenerating && (
              <motion.div
                className="absolute inset-0 opacity-40"
                style={{ background: "linear-gradient(90deg, transparent, #4f39f6, transparent)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              />
            )}
            <p className="text-sm text-gray-400 text-center sm:text-left relative z-10">
              This will generate your in-context product photo. Video generation is a separate step after.
            </p>
            <motion.div
              whileHover={{ scale: isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: isGenerating ? 1 : 0.98 }}
              className="relative z-10 shrink-0"
            >
              <PrimaryButton
                disabled={isGenerating}
                className="px-10 py-3 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_24px_-8px_#4f39f6]"
              >
                 {isGenerating ? (
                  <>
                   <Loader2Icon className="size-5 animate-spin"/> Generating...
                  </>
                ) : (
                <>
                 <Wand2Icon className="size-5" /> Generate image
                </>)}
               </PrimaryButton>
            </motion.div>
          </div>
        </motion.div>

      </motion.form>
    </div>
  )
}

export default Generator