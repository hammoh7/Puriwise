import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ensureConnection = async () => {
  if (!prisma) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

export async function POST(request: Request) {
  try {
    await ensureConnection();

    const { uid, email } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: "UID and email are required" },
        { status: 400 }
      );
    }

    const userProfile = await prisma.userProfile.upsert({
      where: { uid },
      update: { email },
      create: {
        uid,
        email,
        profileComplete: false,
      },
    });

    return NextResponse.json(userProfile, { status: 200 });
  } catch (error: any) {
    console.error("Profile API error:", error);

    let errorMessage = "Server error";
    if (error.name === "PrismaClientInitializationError") {
      errorMessage = "Database connection failed";
    } else if (error.code === "P2002") {
      errorMessage = "User profile already exists";
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
