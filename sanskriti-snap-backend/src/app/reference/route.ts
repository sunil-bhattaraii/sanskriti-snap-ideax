import { docsEnabled } from "@/lib/openapi/enabled";
import { ApiReference } from "@scalar/nextjs-api-reference";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Object-form config (not the request-factory overload) so the handler takes no
// arguments and can be exported directly as the App Router GET.
const reference = ApiReference({
  url: "/openapi.json",
  pageTitle: "Sanskriti Snap API",
});

export async function GET() {
  if (!docsEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  return reference();
}
