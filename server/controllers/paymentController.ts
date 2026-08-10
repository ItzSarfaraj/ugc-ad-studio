import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import { PLANS, PlanId } from "../configs/plans.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { plan } = req.body as { plan: PlanId };

    if (!PLANS[plan]) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const order = await razorpay.orders.create({
      amount: PLANS[plan].amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    await prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        plan,
        amount: PLANS[plan].amount,
        status: "created",
      },
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: "failed" },
      });
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const payment = await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { status: "paid", razorpayPaymentId: razorpay_payment_id },
    });

    const plan = payment.plan as PlanId;
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        credits: { increment: PLANS[plan].credits },
      },
    });

    res.json({ message: "Payment verified", plan });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};