import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCheckoutOrder } from "@/lib/services/billing-service";
import { ProjectDomainError } from "@/lib/services/project-service";

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

    const result = await createCheckoutOrder(user, planTier || "");
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof ProjectDomainError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("Error creating PayPal order:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
