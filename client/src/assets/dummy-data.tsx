import { UploadIcon, VideoIcon, ZapIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <UploadIcon className="w-6 h-6" />,
        title: 'Smart Upload',
        desc: 'Drag and drop yours assets. We auto optimize formats and sizes.'
    },
    {
        icon: <ZapIcon className="w-6 h-6" />,
        title: 'Instant Generation',
        desc: ' Optimized model deliver output in seconds with great fidelity.'
    },
    {
        icon: <VideoIcon className="w-6 h-6" />,
        title: 'Video Synthesis',
        desc: 'Bring product shorts to life with short-form social-ready videos.'
    }
];

export const plansData = [
    {
        id: 'starter',
        name: 'Starter',
        price: '$10',
        desc: 'Try the platform at no cost.',
        credits: 25,
        features: [
            ' 25 Credits',
            'Standard quality',
            'Slower generation speed',
            '1 revision round',
            'Email support'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29',
        desc: 'Creators & small teams.',
        credits: 80,
        features: [
            ' 80 Credits',
            'HD Quality',
            'No watermark',
            'Video Generation',
            'Priority support'
        ],
        popular: true
    },
    {
        id: 'ultra',
        name: 'Ultra',
        price: '$99',
        desc: ' Scale across teams and agencies.',
        credits: 300,
        features: [
            ' 300 Credits ',
            'FHD Quality',
            'No Watermark',
            'Fast Generation Speed',
            'Chat + Email support'
        ]
    }
];

export const faqData = [
    {
        question: ' How does the AI Generation work?',
        answer: 'We leverage state-of-the-art diffusion models trained one millions of product images to blend your product into realistic scenes while preserving details, lighting and reflections.'
    },
    {
        question: 'Do I own the generated images?',
        answer: 'Yes you will receive full commercial rights to any images and videos generated on the plateform.Use them for ads,ecommerce social media and more.'
    },
    {
        question: ' Can I cancel anytime?',
        answer: ' Yes - you can cancel from your dashboard. You will retain access through the end of your billing period.'
    },
    
    {
        question: ' What input format do you support?',
        answer: ' We accept JPG, PNG and WEBP. Outputs are high resolution PNGs and MP4s optimised for social platforms.'
    }
];

export const footerLinks = [
    {
        title: "Quick Links",
        links: [
            { name: "Home", url: "#" },
            { name: "Features", url: "#" },
            { name: "Pricing", url: "#" },
            { name: "FAQ", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
];