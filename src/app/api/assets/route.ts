import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { getVisitorData } from "../../lib/api-utils";
import { query } from "../../lib/db";
import { getExchangeRate } from "../../lib/utils";
import { authOptions } from "../auth/[...nextauth]/route";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      const visitorData = await getVisitorData();
      return NextResponse.json(visitorData, {
        headers: NO_CACHE_HEADERS,
      });
    }

    const result = await query(`
      SELECT date, amount
      FROM assets
      ORDER BY date ASC
    `);

    const exchangeRate = await getExchangeRate();

    return NextResponse.json(
      {
        assets: result.rows,
        exchangeRate,
      },
      {
        headers: NO_CACHE_HEADERS,
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}
