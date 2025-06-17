import { prisma } from "@/lib/prisma";
import { generateHealthReport } from "@/utils/geminiUtils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    const userProfile = await prisma.userProfile.findUnique({
      where: { uid: userId },
      include: { healthReports: true },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const prompt = `
      Generate a clean, professional health advisory report for a ${
        userProfile.age || "unknown"
      }-year-old person.

      User Details:
      - Age: ${userProfile.age || "Not specified"}
      - Health Conditions: ${
        userProfile.healthConditions.length
          ? userProfile.healthConditions.join(", ")
          : "None reported"
      }
      - Activity Level: ${userProfile.activityLevel || "Not specified"}
      - Location: ${userProfile.currentLocation || "Not specified"}
      - Current AQI: ${userProfile.lastAQIReport?.aqi || "Not available"}

      Please format the response as a clean, structured report with the following sections:

      HEALTH ADVISORY REPORT

      OVERVIEW
      [Provide a brief overview of the user's current health status and environmental conditions]

      RECOMMENDATIONS
      [Provide 4-6 specific, actionable health recommendations. Each recommendation should be:
      - Clear and concise (1-2 sentences)
      - Actionable
      - Relevant to the user's conditions and environment]

      IMPORTANT NOTES
      [Include 2-3 important disclaimers and when to seek medical attention]

      Please use simple, clean text without markdown formatting, asterisks, or special characters. 
      Make each section clearly identifiable and ensure recommendations are practical and specific to the user's profile.
      Include relevant keywords related to the health conditions for searchability.
    `;

    const reportText = await generateHealthReport(prompt);

    const healthReport = await prisma.healthReport.create({
      data: {
        userId: userProfile.id,
        reportText,
      },
    });

    return NextResponse.json(healthReport);
  } catch (error) {
    console.error("Health advisor error:", error);
    return NextResponse.json(
      { error: "Failed to generate health report" },
      { status: 500 }
    );
  }
}