import { buildDocument } from "@/lib/openapi/document";
import { docsEnabled } from "@/lib/openapi/enabled";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!docsEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json(buildDocument());
}
