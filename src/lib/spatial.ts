export type Bounds = { south: number; west: number; north: number; east: number };
export function inBounds(lat: number | null, lng: number | null, bounds: Bounds) {
  return lat !== null && lng !== null && lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}
export function distanceKm(a: {lat:number;lng:number}, b: {lat:number;lng:number}) {
  const rad = Math.PI / 180;
  const d = Math.sin((b.lat-a.lat)*rad/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lng-a.lng)*rad/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(d),Math.sqrt(1-d));
}
export const CITY_CENTERS: Record<string, [number,number]> = { Paris:[48.8566,2.3522], Lisbon:[38.7223,-9.1393], Porto:[41.1579,-8.6291], Rome:[41.9028,12.4964], Barcelona:[41.3874,2.1686], London:[51.5074,-.1278], "New York":[40.7128,-74.006] };