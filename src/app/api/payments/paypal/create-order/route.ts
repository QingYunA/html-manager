import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createPayPalOrder, PLAN_PRICING, type PlanTier } from "@/lib/paypal";
import { createOrderRecord } from "@/db";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to initiate checkout" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { planTier } = body as { planTier?: string };

    if (!planTier || !(planTier in PLAN_PRICING)) {
      return NextResponse.json(
        { error: "Invalid or missing plan tier. Supported: 'lite', 'pro'" },
        { status: 400 }
      );
    }

    const tier = planTier as PlanTier;
    const paypalOrder = await createPayPalOrder({
      planTier: tier,
      userId: user.id,
      userEmail: user.email,
    });

    // Record order in database
    await createOrderRecord({
      id: `ord_${nanoid(16)}`,
      userId: user.id,
      userEmail: user.email || null,
      planTier: tier,
      amount: paypalOrder.amount,
      currency: "USD",
      status: "created",
      paypalOrderId: paypalOrder.id,
    });

    return NextResponse.json({
      orderId: paypalOrder.id,
      planTier: tier,
      amount: paypalOrder.amount,
    });
  } catch (err: unknown) {
    console.error("Error creating PayPal order:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
