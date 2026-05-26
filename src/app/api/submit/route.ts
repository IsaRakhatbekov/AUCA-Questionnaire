import { NextResponse } from "next/server";
import { responseToRow, rowToResponse } from "@/lib/db";
import type { SurveyResponse } from "@/lib/storage";
import { getSupabase, getSupabaseEnvError } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const envError = getSupabaseEnvError();
  if (envError) {
    return NextResponse.json({ error: envError }, { status: 503 });
  }

  try {
    const body = (await request.json()) as SurveyResponse;

    if (!body.dept?.trim()) {
      return NextResponse.json(
        { error: "dept is required" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("responses")
      .insert(
        responseToRow({
          dept: body.dept.trim(),
          name: body.name?.trim() ?? "",
          role: body.role?.trim() ?? "",
          contact: body.contact?.trim() ?? "",
          answers: body.answers ?? {},
        }),
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rowToResponse(data));
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
