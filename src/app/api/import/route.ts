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
    const body = (await request.json()) as { responses?: SurveyResponse[] };
    const incoming = body.responses;

    if (!Array.isArray(incoming)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: existing, error: loadError } = await supabase
      .from("responses")
      .select("created_at");

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 500 });
    }

    const seen = new Set(
      (existing ?? []).map((r) => new Date(r.created_at).getTime()),
    );

    const toInsert = incoming
      .filter((r) => r.dept?.trim() && r._ts && !seen.has(r._ts))
      .map((r) => responseToRow(r));

    if (!toInsert.length) {
      return NextResponse.json({ added: 0 });
    }

    const { data, error } = await supabase
      .from("responses")
      .insert(toInsert)
      .select();

    if (error) {
      console.error("Supabase import error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      added: data?.length ?? 0,
      responses: (data ?? []).map(rowToResponse),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
