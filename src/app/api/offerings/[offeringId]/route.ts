import { NextRequest } from "next/server";
import { apiError, apiResponse, requireAuthenticatedUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    offeringId: string;
  };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user, error } = await requireAuthenticatedUser(request);

    if (error || !user) {
      return error ?? apiError("Unauthorized", 401);
    }

    const body = (await request.json()) as {
      is_active?: boolean;
    };

    if (typeof body.is_active !== "boolean") {
      return apiError("is_active must be a boolean");
    }

    const { data: offering } = await supabaseAdmin
      .from("offerings")
      .select("id, user_id")
      .eq("id", context.params.offeringId)
      .single();

    if (!offering) {
      return apiError("Offering not found", 404);
    }

    if (offering.user_id !== user.id) {
      return apiError("You cannot update this offering.", 403);
    }

    const { data: updatedOffering, error: updateError } = await supabaseAdmin
      .from("offerings")
      .update({
        is_active: body.is_active,
      })
      .eq("id", context.params.offeringId)
      .select("*")
      .single();

    if (updateError || !updatedOffering) {
      return apiError("Unable to update offering", 400);
    }

    return apiResponse(
      {
        offering: updatedOffering,
      },
      "Offering updated successfully",
    );
  } catch (error) {
    console.error("Offering PATCH error:", error);
    return apiError("Internal server error", 500);
  }
}
