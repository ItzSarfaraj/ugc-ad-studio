import React, { useState } from "react"
import Title from "../components/Title"
import UploadZone from "../components/UploadZone"
import { Loader2Icon, RectangleHorizontalIcon, RectangleVerticalIcon, SparklesIcon, Wand2Icon } from "lucide-react"
import { PrimaryButton, GhostButton } from "../components/Buttons"
import { useAuth, useUser } from "@clerk/react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import api from "../config/axios"


const Generator = () => {

  const {user} = useUser();
  const {getToken} = useAuth();
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
      const token = await getToken();
      const {data} = await api.post('/api/ai/generate-prompt', {
        productName, productDescription, idea: userPrompt
      }, { headers:{ Authorization:`Bearer ${token}`} })

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

      const token = await getToken();
      const {data} = await api.post('/api/project/create',formData,{
        headers:{ Authorization:`Bearer ${token}`}
      })

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

  return (
    <div className="min-h-screen text-white p-6 md:p-12 mt-28">

      <form onSubmit = {handleGenerate} className="max-w-4xl mx-auto mb-40">
        <Title heading='Create In-Context Image' description="Upload your modal and product images to generate 
        stunning UGC, short-form videos and social media posts"/>

        {/* Section 01 — Images */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 mt-10">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-xs font-mono text-violet-400">01</span>
            <h3 className="text-lg font-semibold">Upload Images</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <UploadZone label="Product Image" file={productImage} onClear={()=>setProductImage(null)} onChange={(e)=>handleFileChange(e,'product')}/>
            <UploadZone label="Model Image" file={modelImage} onClear={()=>setModelImage(null)} onChange={(e)=>handleFileChange(e,'model')}/>
          </div>
        </div>

        {/* Section 02 — Product Details */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 mt-6">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-xs font-mono text-violet-400">02</span>
            <h3 className="text-lg font-semibold">Product Details</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="text-gray-300">
               <label htmlFor="name" className="block text-sm mb-2">Project Name</label>
               <input type='text' id="name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name your project" required
                      className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all"/>
            </div>

            <div className="text-gray-300">
               <label htmlFor="productName" className="block text-sm mb-2">Product Name</label>
               <input type='text' id="productName" value={productName} onChange={(e)=>setProductName(e.target.value)} placeholder="Enter the name of the product" required
                      className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all"/>
            </div>
          </div>

          <div className="mt-6 text-gray-300">
             <label htmlFor="productDescription" className="block text-sm mb-2">Product Description <span className="text-xs text-violet-400">(optional)</span></label>
             <textarea id="productDescription" rows={3} value={productDescription}
                 onChange={(e)=>setProductDescription(e.target.value)} placeholder="Enter the description of the product"
                 className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none resize-none transition-all"/>
          </div>
        </div>

        {/* Section 03 — Style & Direction */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 mt-6">
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-xs font-mono text-violet-400">03</span>
            <h3 className="text-lg font-semibold">Style & Direction</h3>
          </div>

          <div className="text-gray-300">
            <label className="block text-sm mb-3">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {ASPECT_OPTIONS.map(({value, icon: Icon, label, hint}) => (
                <button type="button" key={value} onClick={()=>setAspectRatio(value)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all cursor-pointer
                    ${aspectRatio === value ? 'border-violet-500/50 bg-violet-500/10' : 'border-violet-200/10 bg-white/3 hover:border-violet-500/30'}`}>
                  <Icon className="size-6 shrink-0 text-violet-300"/>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-gray-400 truncate">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-gray-300">
             <div className="flex items-center justify-between mb-2">
               <label htmlFor="userPrompt" className="text-sm">User Prompt <span className="text-xs text-violet-400">(optional)</span></label>
               <GhostButton type="button" onClick={handleGeneratePrompt} disabled={isGeneratingPrompt}
                 className="!px-3 !py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                 {isGeneratingPrompt ? <Loader2Icon className="size-3 animate-spin"/> : <SparklesIcon className="size-3"/>} Generate Prompt
               </GhostButton>
             </div>
             <textarea id="userPrompt" rows={4} value={userPrompt}
                 onChange={(e)=>setUserPrompt(e.target.value)} placeholder="Describe how you want the narration to be, or click Generate Prompt."
                 className="w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none resize-none transition-all"/>
          </div>
        </div>

        {/* Generate bar */}
        <div className="glass-panel rounded-2xl p-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 text-center sm:text-left">
            This will generate your in-context product photo. Video generation is a separate step after.
          </p>
          <PrimaryButton disabled={isGenerating} className="px-10 py-3 rounded-md disabled:opacity-70 disabled:cursor-not-allowed shrink-0">
             {isGenerating ? (
              <>
               <Loader2Icon className="size-5 animate-spin"/> Generating...
              </>
            ) : (
            <>
             <Wand2Icon className="size-5" /> Generate Image
            </>)}
           </PrimaryButton>
        </div>

      </form>  
    </div>
  )
}

export default Generator