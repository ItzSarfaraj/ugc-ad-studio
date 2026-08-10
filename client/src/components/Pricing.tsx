import { useState } from 'react';
import toast from 'react-hot-toast';
import Title from './Title';
import api from '../config/axios';
import { useAuth } from '../context/AuthContext';

const PLANS = [
    { id: 'free', label: 'Free', price: '₹0', credits: 20, features: ['20 credits', 'Watermarked exports'] },
    { id: 'pro', label: 'Pro', price: '₹499', credits: 100, features: ['100 credits / mo', 'No watermark', 'Priority render'] },
    { id: 'premium', label: 'Premium', price: '₹999', credits: 250, features: ['250 credits / mo', 'No watermark', 'Priority render', '4K export'] },
];

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.getElementById('razorpay-sdk')) return resolve(true);
        const script = document.createElement('script');
        script.id = 'razorpay-sdk';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

export default function Pricing() {
    const { user, refreshUser } = useAuth();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleUpgrade = async (planId: string) => {
        if (planId === 'free') return;

        if (!user) {
            toast.error('Please log in to upgrade');
            return;
        }

        setLoadingPlan(planId);
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error('Razorpay SDK failed to load');

            const { data } = await api.post('/api/payment/create-order', { plan: planId });

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: 'UGC Ad Studio',
                description: `${planId} plan`,
                order_id: data.orderId,
                prefill: { name: user.name, email: user.email },
                theme: { color: '#4f39f6' },
                handler: async (response: any) => {
                    try {
                        await api.post('/api/payment/verify', response);
                        toast.success('Plan upgraded!');
                        await refreshUser();
                    } catch {
                        toast.error('Payment verification failed');
                    }
                },
            };

            // @ts-ignore - injected globally by the Razorpay script
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err.message);
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <section id="pricing" className="py-20 bg-white/3 border-t border-white/6">
            <div className="max-w-6xl mx-auto px-4">

                <Title
                    title="Pricing"
                    heading="Pricing Plans"
                    description="Our Pricing plans are simple, transparent and flexible. Choose the plans that best suits your needs."
                />

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-10">
                    {PLANS.map((p) => {
                        const isCurrent = user?.plan === p.id;
                        return (
                            <div key={p.id} className="rounded-2xl overflow-hidden border border-white/10">
                                <div className="bg-white/10 px-6 py-5">
                                    <h3 className="text-xl font-semibold text-white">{p.label}</h3>
                                    <p className="text-3xl font-bold text-white mt-1">
                                        {p.price}<span className="text-sm text-white/50">/mo</span>
                                    </p>
                                </div>
                                <div className="bg-white/6 px-6 py-6">
                                    <ul className="space-y-2 text-sm text-white/70">
                                        {p.features.map((f) => (
                                            <li key={f}>• {f}</li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleUpgrade(p.id)}
                                        disabled={isCurrent || loadingPlan === p.id}
                                        className="w-full mt-6 py-2 rounded-lg bg-[#4f39f6] text-white font-medium disabled:opacity-50 transition"
                                    >
                                        {isCurrent ? 'Current plan' : loadingPlan === p.id ? 'Processing...' : p.id === 'free' ? 'Included' : 'Upgrade'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}