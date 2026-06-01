import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/security/admin-guard";
import { listAllTenantsWithDetails } from "@/lib/db/repositories";

export async function GET(req: Request) {
  try {
    // 1. Authenticate Admin
    await requireAdminSession();
    
    // 2. Fetch all data
    const data = await listAllTenantsWithDetails();
    return NextResponse.json({ tenants: data });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
