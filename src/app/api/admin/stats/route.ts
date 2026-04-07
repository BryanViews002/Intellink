import { NextRequest } from "next/server";
import { apiError, apiResponse, requireAdminUser, requireAuthenticatedUser } from "@/lib/auth";
import { getAdminStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthenticatedUser(request);

    if (error || !user) {
      return error ?? apiError("Unauthorized", 401);
    }

    const isAdmin = await requireAdminUser(user);

    if (!isAdmin) {
      return apiError("Forbidden", 403);
    }

    const stats = await getAdminStats();

    return apiResponse(stats, "Admin stats loaded successfully");
  } catch (error) {
    console.error("Admin stats error:", error);
    return apiError("Internal server error", 500);
  }
}
