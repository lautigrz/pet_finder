export interface GeoPoint {
    latitude: number;
    longitude: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(origin: GeoPoint, destination: GeoPoint): number {
    const dLat = toRadians(destination.latitude - origin.latitude);
    const dLng = toRadians(destination.longitude - origin.longitude);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(origin.latitude)) *
        Math.cos(toRadians(destination.latitude)) *
        Math.sin(dLng / 2) ** 2;

    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}
