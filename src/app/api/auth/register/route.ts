import { NextRequest } from "next/server";
import { apiError, apiResponse, normalizeUsername, validateRequired } from "@/lib/auth";
import { supabaseAdmin, supabaseAuthServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, string>;
    const { valid, missing } = validateRequired(body, [
      "name",
      "email",
      "username",
      "password",
    ]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const name = body.name.trim();
    const email = body.email.trim().toLowerCase();
    const username = normalizeUsername(body.username);
    const password = body.password;

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters long");
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return apiError(
        "Username can only include lowercase letters, numbers, and underscores.",
      );
    }

    const [{ data: existingUsername }, { data: existingEmail }] = await Promise.all([
      supabaseAdmin.from("users").select("id").eq("username", username).maybeSingle(),
      supabaseAdmin.from("users").select("id").eq("email", email).maybeSingle(),
    ]);

    if (existingUsername) {
      return apiError("That username is already taken.", 409);
    }

    if (existingEmail) {
      return apiError("That email is already registered.", 409);
    }

    const { data: createdUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          username,
        },
      });

    if (createError || !createdUser.user) {
      return apiError(createError?.message || "Unable to create account", 400);
    }

    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: createdUser.user.id,
      name,
      email,
      username,
      subscription_plan: null,
      subscription_status: "inactive",
      subscription_expires_at: null,
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);
      return apiError("Unable to create user profile", 400);
    }

    const { data: signInData, error: signInError } =
      await supabaseAuthServer.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError || !signInData.session) {
      return apiError("Account created, but automatic sign-in failed.", 500);
    }

    return apiResponse(
      {
        user_id: createdUser.user.id,
        email,
        subscription_status: "inactive",
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      "Account created successfully. Choose a plan to continue.",
      201,
    );
  } catch (error) {
    console.error("Register error:", error);
    return apiError("Internal server error", 500);
  }
}
