
export type Coordinates = {
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function addressToCoordinates(
  address: string,
): Promise<Coordinates | null> {
  const trimmedAddress = address.trim();

  if (!trimmedAddress) {
    throw new Error("Alamat tidak boleh kosong.");
  }

  const params = new URLSearchParams({
    q: `${trimmedAddress}, Indonesia`,
    format: "jsonv2",
    limit: "1",
    countrycodes: "id",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Gagal mencari koordinat alamat.");
  }

  const results: NominatimResult[] = await response.json();
  const result = results[0];

  if (!result) {
    return null;
  }

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Koordinat yang diterima tidak valid.");
  }

  return {
    latitude,
    longitude,
  };
}
