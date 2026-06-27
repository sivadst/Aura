import { NextResponse } from "next/server";
import { logger } from "./logger";

export async function apiWrapper(
  handler: () => Promise<NextResponse | Response>,
  context: string = "API"
) {
  try {
    return await handler();
  } catch (error: any) {
    logger.error({ err: error, context }, "API Error");
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
