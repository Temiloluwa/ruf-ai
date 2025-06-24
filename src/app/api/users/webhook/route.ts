import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_IMAGE_URL = "/logo.svg"; // fallback image

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add CLERK_SIGNING_SECRET from Clerk Dashboard to .env or .env",
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  const eventType = evt.type;

  // Helper to extract primary email
  function getPrimaryEmail(data: any) {
    if (!data.email_addresses || !data.primary_email_address_id) return "";
    const primary = data.email_addresses.find(
      (e: any) => e.id === data.primary_email_address_id,
    );
    return primary?.email_address || "";
  }

  // Helper to get image or fallback
  function getImageUrl(data: any) {
    return data.image_url || DEFAULT_IMAGE_URL;
  }

  // Upsert user for both created and updated events
  if (eventType === "user.created" || eventType === "user.updated") {
    const { data } = evt;
    if (!data.id) {
      return new Response("Error: Missing user ID", {
        status: 400,
      });
    }
    // Always set all fields, with fallbacks
    const values = {
      name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
      email: getPrimaryEmail(data),
      imageUrl: getImageUrl(data),
      password: "", // Always empty, Clerk manages auth
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
    };
    // Try to update first; if no rows affected, insert
    const result = await db
      .update(users)
      .set(values)
      .where(eq(users.clerkId, data.id));
    if (result.rowCount === 0) {
      await db.insert(users).values({
        clerkId: data.id,
        ...values,
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      });
    }
  }

  if (eventType === "user.deleted") {
    const { data } = evt;
    if (!data.id) {
      return new Response("Error: Missing user ID", {
        status: 400,
      });
    }
    await db.delete(users).where(eq(users.clerkId, data.id));
  }

  return new Response("Webhook received", { status: 200 });
}
