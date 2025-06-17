export const getLocationFromCoords = async (
  lat: number,
  lon: number
): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
  if (!apiKey) throw new Error("OpenCage API key is not configured.");

  const url =
    `https://api.opencagedata.com/geocode/v1/json` +
    `?q=${lat},${lon}` +
    `&key=${apiKey}` +
    `&language=en&limit=1&no_annotations=1`;

  const response = await fetch(url);
  if (!response.ok)
    throw new Error("Failed to fetch location from coordinates.");

  const data = await response.json();
  if (data.results?.length) {
    const { city, town, village, postcode } = data.results[0].components;
    return postcode || city || town || village || "Unknown location";
  }
  return "Unknown location";
};

export const getCoordsFromLocation = async (
  location: string
): Promise<{ lat: number; lon: number }> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
  if (!apiKey) throw new Error("OpenCage API key is not configured.");

  const url =
    `https://api.opencagedata.com/geocode/v1/json` +
    `?q=${encodeURIComponent(location)}` +
    `&key=${apiKey}` +
    `&limit=1&pretty=1&no_annotations=1&countrycode=IN`;

  const response = await fetch(url);
  if (!response.ok)
    throw new Error("Failed to fetch coordinates from location.");

  const data = await response.json();
  if (data.results?.length) {
    const { lat, lng } = data.results[0].geometry;
    return { lat, lon: lng };
  }
  throw new Error("Location not found");
};