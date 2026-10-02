/**
 * docs/API Contract.md 6.1 -- Cloudinary signed upload params.
 *
 * Stateless: nothing is written and no asset record is created. The signature
 * authorizes one upload into one folder, and the `publicId` it yields is
 * consumed by whatever write comes next -- a profile patch, an artifact, a
 * verification attempt.
 *
 * Auth is required because a signature is a credential. An anonymous caller
 * could otherwise spend the project Cloudinary quota.
 */

import { NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth";
import { signUpload } from "@/lib/cloudinary";
import { MediaSignRequest } from "@/lib/contracts";
import { toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthContext();

    // contentType is validated by the schema and then not used: it is a
    // declaration, not a signed constraint. The signature covers folder and
    // timestamp only (docs/API Contract.md 6.1).
    const { purpose } = MediaSignRequest.parse(await readJsonBody(request));

    return NextResponse.json(signUpload(purpose, user._id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
