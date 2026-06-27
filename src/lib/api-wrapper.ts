import { NextResponse } from "next/server";
import { logger } from "./logger";

export async function apiWrapper(
  handler: () => Promise<NextResponse | Response>,
  context: string = "API"
) {
  try {
    return await handler();
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error({ err, context }, "API Error");
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
