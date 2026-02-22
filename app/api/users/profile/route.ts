import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json(
    { error: "Profile settings disabled" },
    { status: 410 },
  );
}
