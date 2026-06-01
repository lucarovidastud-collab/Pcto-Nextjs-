import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "super-secret-admin-fallback-key-2026";
const encodedKey = new TextEncoder().encode(ADMIN_SECRET_KEY);

export async function createAdminSessionToken(payload: { role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(encodedKey);
}

export async function verifyAdminSessionToken(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"]
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdminSession(req?: NextRequest) {
  const cookieStore = await cookies();
  let token = cookieStore.get("admin_token")?.value;
  
  if (!token && req) {
    token = req.cookies.get("admin_token")?.value;
  }

  const payload = await verifyAdminSessionToken(token);
  if (!payload || payload.role !== "superadmin") {
    throw new Error("Unauthorized");
  }
  return payload;
}
