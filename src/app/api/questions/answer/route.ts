import { NextRequest } from "next/server";
import {
  apiError,
  apiResponse,
  requireAuthenticatedUser,
  validateRequired,
} from "@/lib/auth";
import { sendAnswerEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthenticatedUser(request);

    if (error || !user) {
      return error ?? apiError("Unauthorized", 401);
    }

    const body = (await request.json()) as Record<string, string>;
    const { valid, missing } = validateRequired(body, [
      "question_id",
      "answer_text",
    ]);

    if (!valid) {
      return apiError(`Missing fields: ${missing.join(", ")}`);
    }

    const { data: question } = await supabaseAdmin
      .from("questions")
      .select(
        `
          id,
          question_text,
          transactions!inner(
            id,
            expert_id,
            client_name,
            client_email
          )
        `,
      )
      .eq("id", body.question_id)
      .single();

    if (!question) {
      return apiError("Question not found", 404);
    }

    const transaction = Array.isArray(question.transactions)
      ? question.transactions[0]
      : question.transactions;

    if (!transaction || transaction.expert_id !== user.id) {
      return apiError("You are not allowed to answer this question.", 403);
    }

    const answerText = body.answer_text.trim();

    await supabaseAdmin
      .from("questions")
      .update({
        answer_text: answerText,
        is_answered: true,
      })
      .eq("id", body.question_id);

    const { data: expert } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    if (expert) {
      try {
        await sendAnswerEmail(
          transaction.client_email,
          transaction.client_name,
          expert.name,
          answerText,
        );
      } catch (error) {
        console.error("Answer email failed:", error);
      }
    }

    return apiResponse(
      {
        question_id: body.question_id,
        is_answered: true,
      },
      "Answer sent successfully",
    );
  } catch (error) {
    console.error("Question answer error:", error);
    return apiError("Internal server error", 500);
  }
}
