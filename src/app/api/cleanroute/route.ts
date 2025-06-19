import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as turf from "@turf/turf";
import polyline from "@mapbox/polyline";
import { fetchAQI } from "@/utils/aqiUtils";

interface StreetSegment {
  _id: { $oid: string };
  geometry: { type: string; coordinates: number[][] };
  embedding: number[];
  createdAt: { $date: string };
}

interface RawSegmentResponse {
  cursor?: {
    firstBatch?: StreetSegment[];
  };
}

interface GraphNode {
  point: { lat: number; lng: number };
  adjacent: { to: string; weight: number }[];
}

export async function GET(request: NextRequest) {
  try {
    console.log("Received cleanroute request");
    const { searchParams } = new URL(request.url);
    const params = {
      startLat: parseFloat(searchParams.get("startLat") || "0"),
      startLng: parseFloat(searchParams.get("startLng") || "0"),
      endLat: parseFloat(searchParams.get("endLat") || "0"),
      endLng: parseFloat(searchParams.get("endLng") || "0"),
      userId: searchParams.get("userId"),
    };

    console.log("Request parameters:", params);

    if (
      !params.userId ||
      isNaN(params.startLat) ||
      isNaN(params.startLng) ||
      isNaN(params.endLat) ||
      isNaN(params.endLng)
    ) {
      console.error("Invalid parameters");
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const aqiApiKey = process.env.NEXT_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY;
    if (!mapsApiKey || !aqiApiKey) {
      console.error("API keys are not configured");
      return NextResponse.json(
        { error: "Server configuration error: API keys missing" },
        { status: 500 }
      );
    }

    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${params.startLat},${params.startLng}&destination=${params.endLat},${params.endLng}&key=${mapsApiKey}&mode=walking&alternatives=true`;
    const directionsResponse = await fetch(directionsUrl);
    const directionsData = await directionsResponse.json();

    if (!directionsData.routes?.length) {
      console.error("No routes found from Google Maps");
      return NextResponse.json({ error: "No routes found" }, { status: 404 });
    }

    const fastestRoute = directionsData.routes[0];
    console.log("Fastest route found");
    const fastestPolyline = fastestRoute.overview_polyline.points;

    const buffer = 0.15; 
    const minLat = Math.min(params.startLat, params.endLat) - buffer;
    const maxLat = Math.max(params.startLat, params.endLat) + buffer;
    const minLng = Math.min(params.startLng, params.endLng) - buffer;
    const maxLng = Math.max(params.startLng, params.endLng) + buffer;

    const polygon = {
      type: "Polygon",
      coordinates: [
        [
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ],
      ],
    };

    console.log(
      "Querying street segments with polygon:",
      JSON.stringify(polygon)
    );
    const rawSegments = await prisma.streetSegment.findRaw({
      filter: {
        geometry: {
          $geoIntersects: {
            $geometry: polygon,
          },
        },
      },
    });

    let segments: StreetSegment[] = [];
    if (Array.isArray(rawSegments)) {
      segments = rawSegments as StreetSegment[];
    } else if (rawSegments && "cursor" in rawSegments) {
      const segmentResponse = rawSegments as RawSegmentResponse;
      segments = segmentResponse.cursor?.firstBatch || [];
    } else {
      console.warn("Unexpected segments format:", rawSegments);
    }

    console.log(`Found ${segments.length} street segments`, segments);

    let cleanestPolyline: string;
    let cleanestDistance: number;
    let cleanestTime: number;

    if (segments.length === 0) {
      console.warn("No segments found, using alternative Google Maps route");
      if (directionsData.routes.length > 1) {
        const alternativeRoute = directionsData.routes[1];
        cleanestPolyline = alternativeRoute.overview_polyline.points;
        cleanestDistance = alternativeRoute.legs[0].distance.value;
        cleanestTime = alternativeRoute.legs[0].duration.value;
      } else {
        console.warn("No alternative routes, falling back to fastest route");
        cleanestPolyline = fastestPolyline;
        cleanestDistance = fastestRoute.legs[0].distance.value;
        cleanestTime = fastestRoute.legs[0].duration.value;
      }
    } else {
      const graph: { [key: string]: GraphNode } = {};
      const edgeToSegment: { [key: string]: StreetSegment } = {};

      for (const segment of segments) {
        const coords = segment.geometry.coordinates;
        const start = coords[0];
        const end = coords[coords.length - 1];
        const startKey = `${start[1].toFixed(6)},${start[0].toFixed(6)}`;
        const endKey = `${end[1].toFixed(6)},${end[0].toFixed(6)}`;

        const weight = segment.embedding?.[0] || 1;

        if (!graph[startKey]) {
          graph[startKey] = {
            point: { lat: start[1], lng: start[0] },
            adjacent: [],
          };
        }
        if (!graph[endKey]) {
          graph[endKey] = { point: { lat: end[1], lng: end[0] }, adjacent: [] };
        }

        graph[startKey].adjacent.push({ to: endKey, weight });
        graph[endKey].adjacent.push({ to: startKey, weight });

        edgeToSegment[`${startKey}-${endKey}`] = segment;
        edgeToSegment[`${endKey}-${startKey}`] = segment;
      }

      const distance = (
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number
      ) => {
        const R = 6371e3; 
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lng2 - lng1) * Math.PI) / 180;
        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      let startNode = "";
      let endNode = "";
      let minStartDist = Infinity;
      let minEndDist = Infinity;

      for (const key in graph) {
        const { lat, lng } = graph[key].point;
        const startDist = distance(params.startLat, params.startLng, lat, lng);
        const endDist = distance(params.endLat, params.endLng, lat, lng);

        if (startDist < minStartDist) {
          minStartDist = startDist;
          startNode = key;
        }
        if (endDist < minEndDist) {
          minEndDist = endDist;
          endNode = key;
        }
      }

      console.log(`Start node: ${startNode}, End node: ${endNode}`);

      const dijkstra = (start: string, end: string) => {
        const distances: { [key: string]: number } = {};
        const previous: { [key: string]: string | null } = {};
        const unvisited = new Set(Object.keys(graph));

        for (const node in graph) distances[node] = Infinity;
        distances[start] = 0;

        while (unvisited.size) {
          let current: string | null = null;
          let smallestDistance = Infinity;

          for (const node of unvisited) {
            if (distances[node] < smallestDistance) {
              smallestDistance = distances[node];
              current = node;
            }
          }

          if (current === null || current === end) break;
          unvisited.delete(current);

          for (const { to, weight } of graph[current].adjacent) {
            if (!unvisited.has(to)) continue;
            const alt = distances[current] + weight;
            if (alt < distances[to]) {
              distances[to] = alt;
              previous[to] = current;
            }
          }
        }

        const path = [];
        let current: string | null = end;
        while (current) {
          path.unshift(current);
          current = previous[current];
        }
        return path[0] === start ? path : null;
      };

      const cleanestPath = dijkstra(startNode, endNode);

      if (!cleanestPath) {
        console.warn("No clean path found, using alternative route");
        if (directionsData.routes.length > 1) {
          const alternativeRoute = directionsData.routes[1];
          cleanestPolyline = alternativeRoute.overview_polyline.points;
          cleanestDistance = alternativeRoute.legs[0].distance.value;
          cleanestTime = alternativeRoute.legs[0].duration.value;
        } else {
          console.warn("No alternative routes, falling back to fastest route");
          cleanestPolyline = fastestPolyline;
          cleanestDistance = fastestRoute.legs[0].distance.value;
          cleanestTime = fastestRoute.legs[0].duration.value;
        }
      } else {
        const cleanestSegments = [];
        for (let i = 0; i < cleanestPath.length - 1; i++) {
          const segment =
            edgeToSegment[`${cleanestPath[i]}-${cleanestPath[i + 1]}`];
          if (segment) cleanestSegments.push(segment);
        }

        const cleanestCoords: number[][] = [];
        cleanestSegments.forEach((segment) =>
          cleanestCoords.push(...segment.geometry.coordinates)
        );

        cleanestPolyline = polyline.encode(
          cleanestCoords.map(([lng, lat]) => [lat, lng])
        );
        const cleanestLine = turf.lineString(cleanestCoords);
        cleanestDistance = turf.length(cleanestLine, { units: "meters" });
        cleanestTime = cleanestDistance / 1.4; 
      }
    }

    const samplePoints = (line: any, interval: number) => {
      const length = turf.length(line, { units: "meters" });
      const numSamples = Math.min(Math.ceil(length / interval), 10); 
      const samples = [];
      for (let i = 0; i <= numSamples; i++) {
        const dist = (i / numSamples) * length;
        samples.push(turf.along(line, dist, { units: "meters" }));
      }
      return samples;
    };

    const computeExposure = async (line: any) => {
      try {
        const points = samplePoints(line, 200);
        console.log(`Sampled ${points.length} points for AQI`);

        const aqiValues = await Promise.all(
          points.map((p) => {
            const [lng, lat] = p.geometry.coordinates;
            return fetchAQI(lat, lng);
          })
        );

        const validAqiValues = aqiValues.filter(
          (aqi): aqi is number => aqi !== null
        );

        console.log(
          `Valid AQI values: ${validAqiValues.length}/${aqiValues.length}`,
          validAqiValues
        );

        return validAqiValues.length > 0
          ? validAqiValues.reduce((sum, aqi) => sum + aqi, 0) /
              validAqiValues.length
          : 0;
      } catch (error) {
        console.error("Error computing exposure:", error);
        return 0;
      }
    };

    const fastestLine = turf.lineString(
      polyline.decode(fastestPolyline).map(([lat, lng]) => [lng, lat])
    );
    const cleanestLine = turf.lineString(
      polyline.decode(cleanestPolyline).map(([lat, lng]) => [lng, lat])
    );

    const [fastestExposure, cleanestExposure] = await Promise.all([
      computeExposure(fastestLine),
      computeExposure(cleanestLine),
    ]);

    console.log("Computed routes successfully", {
      fastestExposure,
      cleanestExposure,
    });

    return NextResponse.json({
      fastest: {
        polyline: fastestPolyline,
        distance: fastestRoute.legs[0].distance.value,
        time: fastestRoute.legs[0].duration.value,
        exposure: fastestExposure,
      },
      cleanest: {
        polyline: cleanestPolyline,
        distance: cleanestDistance,
        time: cleanestTime,
        exposure: cleanestExposure,
      },
    });
  } catch (error) {
    console.error("Error in cleanroute API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
