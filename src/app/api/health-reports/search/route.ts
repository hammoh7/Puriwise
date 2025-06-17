import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface AggregationResponse {
  cursor?: {
    firstBatch?: any[];
    id?: number;
    ns?: string;
  };
  ok?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const query = searchParams.get("query");

    if (!userId || !query) {
      return NextResponse.json(
        { error: "User ID and search query are required" },
        { status: 400 }
      );
    }

    

    const rawResult = await prisma.$runCommandRaw({
      aggregate: "HealthReport",
      pipeline: [
        {
          $search: {
            index: "healthReportTextIndex",
            text: {
              query: query,
              path: "reportText",
              fuzzy: {
                maxEdits: 2, 
                prefixLength: 2,
              },
            },
          },
        },
        {
          $match: {
            userId: userId,
          },
        },
        {
          $project: {
            reportText: 1,
            createdAt: 1,
            score: { $meta: "searchScore" },
          },
        },
        {
          $sort: { score: -1 },
        },
        {
          $limit: 10,
        },
      ],
      cursor: {},
    });

    const result = rawResult as unknown as AggregationResponse;
    console.log("Raw Search Result:", rawResult); 
    const reports = result.cursor?.firstBatch || [];
    if (!Array.isArray(reports)) {
      throw new Error("Unexpected response format from Atlas Search");
    }

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search health reports", details: error.message },
      { status: 500 }
    );
  }
}
