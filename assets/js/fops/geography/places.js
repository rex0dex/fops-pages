// Size It Up: which places are in the game, and how their real shapes are prepared.
//
// Shapes come from Natural Earth (via the world-atlas and us-atlas packages).
// Every size in the game is computed from those real borders with d3-geo, so
// nothing is made up. Far-away territories are dropped (for example French
// Guiana is not drawn as part of France), because they would distort the shape.
import { geoArea, geoCentroid, geoDistance } from 'https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/+esm';

export const EARTH_RADIUS_KM = 6371.0088;
export const MAX_PART_DISTANCE_KM = 2200;
// Very long or spread-out countries keep all their main parts (islands, far ends).
export const SPREAD_OUT = { Indonesia: 6000, Philippines: 3000, Canada: 4500, Chile: 4500, Argentina: 4000 };

export const COUNTRIES = [
  'Afghanistan', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile',
  'China', 'Colombia', 'Cuba', 'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'Greenland', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Kazakhstan', 'Kenya',
  'Madagascar', 'Mexico', 'Mongolia', 'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway',
  'Pakistan', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Saudi Arabia', 'South Africa', 'South Korea',
  'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Kingdom', 'Vietnam',
];

export const US_STATES = [
  'Alaska', 'Arizona', 'California', 'Colorado', 'Delaware', 'Florida', 'Hawaii', 'Michigan', 'Montana',
  'Nevada', 'New York', 'Oregon', 'Rhode Island', 'Texas', 'Utah', 'Washington',
];

// Keep the largest piece of a place, plus any piece whose center is within
// maxKm of the largest piece's center.
export function mainParts(feature, maxKm = MAX_PART_DISTANCE_KM) {
  const g = feature.geometry;
  if (!g || g.type !== 'MultiPolygon') return feature;
  const parts = g.coordinates.map((coords) => {
    const part = { type: 'Feature', geometry: { type: 'Polygon', coordinates: coords } };
    return { coords, area: geoArea(part), center: geoCentroid(part) };
  });
  const largest = parts.reduce((a, b) => (b.area > a.area ? b : a));
  const maxAngle = maxKm / EARTH_RADIUS_KM;
  const kept = parts.filter((p) => p === largest || geoDistance(p.center, largest.center) <= maxAngle);
  return { ...feature, geometry: { type: 'MultiPolygon', coordinates: kept.map((p) => p.coords) } };
}

export function areaKm2(feature) {
  return geoArea(feature) * EARTH_RADIUS_KM * EARTH_RADIUS_KM;
}

// Build the playable list from the two map datasets (already converted to GeoJSON features).
export function buildPlaces(countryFeatures, stateFeatures) {
  const byName = (features, names, kind) => names.map((name) => {
    const f = features.find((x) => x.properties && x.properties.name === name);
    if (!f) return null;
    const shape = mainParts(f, SPREAD_OUT[name] || MAX_PART_DISTANCE_KM);
    return { name, kind, shape, area: areaKm2(shape), center: geoCentroid(shape) };
  }).filter(Boolean);
  return [...byName(countryFeatures, COUNTRIES, 'country'), ...byName(stateFeatures, US_STATES, 'US state')];
}
