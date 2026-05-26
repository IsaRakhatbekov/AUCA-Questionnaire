import { NextResponse } from "next/server";
import { rowToResponse } from "@/lib/db";
import { getSupabase, getSupabaseEnvError } from "@/lib/supabase-server";

export async function GET() {
  const envError = getSupabaseEnvError();
  if (envError) {
    return NextResponse.json({ error: envError }, { status: 503 });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("responses")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map(rowToResponse));
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
