export const PLANS = {
  pro: { amount: 49900, credits: 100, label: "Pro" },       // amount in paise = ₹499
  premium: { amount: 99900, credits: 250, label: "Premium" }, // ₹999
} as const;

export type PlanId = keyof typeof PLANS;