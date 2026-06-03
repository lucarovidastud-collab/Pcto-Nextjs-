import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

function getAdminSecretKey() {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    throw new Error("ADMIN_SECRET_KEY deve essere configurata come variabile d'ambiente.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(payload: { role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getAdminSecretKey());
}

export async function verifyAdminSessionToken(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, getAdminSecretKey(), {
      algorithms: ["HS256"]
    });
    return payload;
  } catch {
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
