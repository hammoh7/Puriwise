import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ensureConnection = async () => {
  if (!prisma) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await ensureConnection();

    const userId = params.userId;
    console.log(`Fetching profile for user: ${userId}`);

    const userProfile = await prisma.userProfile.findUnique({
      where: { uid: userId },
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

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await ensureConnection();

    const userId = params.userId;
    const data = await request.json();

    const updatedProfile = await prisma.userProfile.update({
      where: { uid: userId },
      data,
    });

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 }
    );
  }
}
