import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { capturePayPalOrder } from "@/lib/paypal";
import { completeOrderRecord, getOrderByPayPalId } from "@/db";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to capture payment" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { orderId } = body as { orderId?: string };

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing orderId" },
        { status: 400 }
      );
    }

    // 1. Verify order exists in our system
    const localOrder = await getOrderByPayPalId(orderId);
    if (!localOrder) {
      return NextResponse.json(
        { error: "Order record not found" },
        { status: 404 }
      );
    }

    // 2. Strict IDOR protection: only the ordering user (or platform admin) can capture
    if (localOrder.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to capture this order" },
        { status: 403 }
      );
    }

    // 3. Short-circuit idempotency: if already completed, return success without re-capturing
    if (localOrder.status === "completed") {
      return NextResponse.json({
        success: true,
        orderId,
        captureId: localOrder.paypalCaptureId,
        planTier: localOrder.planTier,
        alreadyCompleted: true,
      });
    }

    // 4. Capture payment with PayPal
    const captureResult = await capturePayPalOrder(orderId);

    if (!captureResult.success) {
      return NextResponse.json(
        {
          error: "PayPal payment was not completed",
          status: captureResult.status,
        },
        { status: 400 }
      );
    }

    // 5. Mark order as completed and upgrade user subscription
    const updated = await completeOrderRecord(
      orderId,
      captureResult.captureId || `cap_${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      orderId,
      captureId: captureResult.captureId,
      planTier: updated?.planTier || localOrder?.planTier || "lite",
    });
  } catch (err: unknown) {
    console.error("Error capturing PayPal order:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
