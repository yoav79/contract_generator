import { NextResponse } from "next/server";

import { isAdminStaff } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import {
  downloadGeneratedPdf,
  DOWNLOAD_FAILED_MESSAGE,
  DOWNLOAD_MISSING_USER_MESSAGE,
  DOWNLOAD_NOT_AVAILABLE_MESSAGE,
  DOWNLOAD_NOT_FOUND_MESSAGES,
  DOWNLOAD_UNAUTHORIZED_MESSAGE,
} from "@/server/documents/download-generated-pdf";

const UNAUTHENTICATED_MESSAGE = "Sesión inválida. Inicia sesión nuevamente.";

type DownloadRouteContext = {
  params: Promise<{ generatedDocumentId: string }>;
};

export async function GET(
  _request: Request,
  context: DownloadRouteContext,
): Promise<NextResponse> {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    return new NextResponse(UNAUTHENTICATED_MESSAGE, { status: 401 });
  }

  if (!isAdminStaff(session.role)) {
    return new NextResponse(DOWNLOAD_UNAUTHORIZED_MESSAGE, { status: 403 });
  }

  const { generatedDocumentId } = await context.params;

  try {
    const result = await downloadGeneratedPdf({
      generatedDocumentId,
      userId: session.userId,
      userRole: session.role,
    });

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === DOWNLOAD_UNAUTHORIZED_MESSAGE) {
        return new NextResponse(DOWNLOAD_UNAUTHORIZED_MESSAGE, { status: 403 });
      }

      if (DOWNLOAD_NOT_FOUND_MESSAGES.has(error.message)) {
        return new NextResponse(DOWNLOAD_NOT_AVAILABLE_MESSAGE, {
          status: 404,
        });
      }

      if (error.message === DOWNLOAD_MISSING_USER_MESSAGE) {
        return new NextResponse(DOWNLOAD_FAILED_MESSAGE, { status: 500 });
      }
    }

    return new NextResponse(DOWNLOAD_FAILED_MESSAGE, { status: 500 });
  }
}
