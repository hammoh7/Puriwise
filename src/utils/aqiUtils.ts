export const fetchAQI = async (lat: number, lon: number): Promise<number | null> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY;
  if (!apiKey) throw new Error("Google Air Quality API key is not configured.");

  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
  const requestBody = {
    location: {
      latitude: lat,
      longitude: lon,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    console.log("Google AQI Response:", data); 

    if (data && data.indexes && data.indexes.length > 0) {
      const aqiIndex = data.indexes.find((index: any) => index.aqi);
      return aqiIndex ? Math.round(aqiIndex.aqi) : null;
    }
    console.warn("No AQI data found in response");
    return null;
  } catch (error) {
    console.error("AQI fetch error:", error);
    return null;
  }
};