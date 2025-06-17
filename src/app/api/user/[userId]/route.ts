import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const { userId } = context.params;
    const data = await request.json();

    const existingUser = await prisma.userProfile.findUnique({
      where: { uid: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedProfile = await prisma.userProfile.update({
      where: { uid: userId },
      data,
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const userId = context.params.userId;
    console.log(`Fetching profile for user: ${userId}`);

    const userProfile = await prisma.userProfile.findUnique({
      where: { uid: userId },
      include: { healthReports: true },
    });

    if (userProfile) {
      return NextResponse.json(userProfile);
    }

    console.warn(`Profile not found for user: ${userId}`);
    return NextResponse.json(
      { error: "User profile not found" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error.message },
      { status: 500 }
    );
  }
}
