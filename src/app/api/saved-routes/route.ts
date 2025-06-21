import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const savedRoutes = await prisma.savedRoute.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        routeType: true,
        polyline: true,
        exposure: true,
        distance: true,
        time: true,
        start: true,
        startName: true,
        end: true,
        endName: true,
        createdAt: true,
        mode: true,
      },
    });

    return NextResponse.json(savedRoutes, { status: 200 });
  } catch (error) {
    console.error("Error fetching saved routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved routes", details: String(error) },
      { status: 500 }
    );
  }
}
