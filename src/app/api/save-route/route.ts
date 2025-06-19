import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      name,
      start,
      startName,
      end,
      endName,
      routeType,
      polyline,
      exposure,
      distance,
      time,
    } = await request.json();

    if (!userId || !routeType || !polyline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const savedRoute = await prisma.savedRoute.create({
      data: {
        userId,
        name,
        start,
        startName,
        end,
        endName,
        routeType,
        polyline,
        exposure,
        distance,
        time,
      },
    });

    return NextResponse.json(savedRoute, { status: 201 });
  } catch (error) {
    console.error("Error saving route:", error);
    return NextResponse.json(
      { error: "Failed to save route" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { routeId, userId } = await request.json();

    if (!routeId || !userId) {
      return NextResponse.json(
        { error: "Missing routeId or userId" },
        { status: 400 }
      );
    }

    const route = await prisma.savedRoute.findUnique({
      where: { id: routeId },
      select: { userId: true },
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (route.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this route" },
        { status: 403 }
      );
    }

    await prisma.savedRoute.delete({
      where: { id: routeId },
    });

    return NextResponse.json(
      { message: "Route deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting route:", error);
    return NextResponse.json(
      { error: "Failed to delete route", details: String(error) },
      { status: 500 }
    );
  }
}
