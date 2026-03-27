import type { WeatherPoint, MotoRiskScore, RouteSegment } from '../types/index.js';

const RAINY_CODES = [61, 63, 65, 80, 81, 82];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getOverallLevel(score: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (score <= 25) return 'green';
  if (score <= 50) return 'yellow';
  if (score <= 75) return 'orange';
  return 'red';
}

function generateRecommendation(overall: 'green' | 'yellow' | 'orange' | 'red'): string {
  switch (overall) {
    case 'green':
      return 'Conditions ideales pour rouler. Bonne route !';
    case 'yellow':
      return 'Conditions acceptables, restez vigilant et adaptez votre conduite.';
    case 'orange':
      return 'Conditions degradees. Roulez avec prudence ou reportez si possible.';
    case 'red':
      return 'Conditions dangereuses. Il est fortement deconseille de prendre la moto.';
  }
}

function generateDetails(weather: WeatherPoint, risks: {
  rain_risk: number;
  wind_risk: number;
  freeze_risk: number;
  storm_risk: number;
  visibility_risk: number;
}): string[] {
  const details: string[] = [];

  if (risks.rain_risk > 30) {
    details.push(`Risque de pluie eleve (${weather.precipitation_probability}% de probabilite, ${weather.precipitation}mm prevu).`);
  } else if (risks.rain_risk > 10) {
    details.push(`Pluie possible (${weather.precipitation_probability}% de probabilite).`);
  }

  if (weather.wind_gusts > 80) {
    details.push(`Rafales de vent tres dangereuses a ${weather.wind_gusts} km/h. Ne roulez pas !`);
  } else if (weather.wind_gusts > 60) {
    details.push(`Rafales de vent fortes a ${weather.wind_gusts} km/h. Prudence extreme.`);
  } else if (weather.wind_gusts > 40) {
    details.push(`Vent modere avec rafales a ${weather.wind_gusts} km/h.`);
  }

  if (weather.temperature < 2) {
    details.push(`Temperature tres basse (${weather.temperature}°C). Risque de verglas.`);
  } else if (weather.temperature < 4) {
    details.push(`Temperature fraiche (${weather.temperature}°C). Risque de gel possible.`);
  }

  if (weather.thunderstorm_risk >= 3) {
    details.push('Risque orageux tres eleve. Abritez-vous.');
  } else if (weather.thunderstorm_risk >= 2) {
    details.push('Risque orageux significatif.');
  } else if (weather.thunderstorm_risk >= 1) {
    details.push('Risque orageux faible.');
  }

  if (weather.visibility < 0.5) {
    details.push(`Visibilite tres reduite (${weather.visibility.toFixed(1)} km). Extremement dangereux.`);
  } else if (weather.visibility < 2) {
    details.push(`Visibilite reduite (${weather.visibility.toFixed(1)} km).`);
  }

  if (weather.snow > 0.5) {
    details.push(`Chutes de neige (${weather.snow} cm/h). Route impraticable a moto.`);
  } else if (weather.snow > 0) {
    details.push(`Neige legere (${weather.snow} cm/h).`);
  }

  if (details.length === 0) {
    details.push('Aucun risque meteorologique significatif detecte.');
  }

  return details;
}

export function calculateRiskScore(weather: WeatherPoint): MotoRiskScore {
  const rain_risk = clamp(
    weather.precipitation_probability * 0.4 +
    Math.min(weather.precipitation * 10, 100) * 0.4 +
    (RAINY_CODES.includes(weather.weather_code) ? 20 : 0),
    0,
    100,
  );

  let wind_risk: number;
  if (weather.wind_gusts > 80) wind_risk = 100;
  else if (weather.wind_gusts > 60) wind_risk = 70;
  else if (weather.wind_gusts > 40) wind_risk = 40;
  else if (weather.wind_gusts > 25) wind_risk = 20;
  else wind_risk = 0;

  const freeze_risk = weather.temperature < 4
    ? clamp((4 - weather.temperature) * 15, 0, 100)
    : 0;

  let storm_risk: number;
  switch (weather.thunderstorm_risk) {
    case 3: storm_risk = 100; break;
    case 2: storm_risk = 60; break;
    case 1: storm_risk = 30; break;
    default: storm_risk = 0;
  }

  let visibility_risk: number;
  if (weather.visibility < 0.5) visibility_risk = 100;
  else if (weather.visibility < 1) visibility_risk = 70;
  else if (weather.visibility < 2) visibility_risk = 40;
  else if (weather.visibility < 5) visibility_risk = 20;
  else visibility_risk = 0;

  let score = clamp(
    rain_risk * 0.35 +
    wind_risk * 0.25 +
    freeze_risk * 0.20 +
    storm_risk * 0.15 +
    visibility_risk * 0.05,
    0,
    100,
  );

  let overall = getOverallLevel(score);

  // Auto RED overrides
  const autoRed =
    weather.wind_gusts > 80 ||
    weather.thunderstorm_risk >= 3 ||
    weather.snow > 0.5 ||
    weather.visibility < 0.5 ||
    (weather.temperature < 2 && weather.precipitation > 0);

  if (autoRed) {
    overall = 'red';
    score = Math.max(score, 76);
  }

  const risks = { rain_risk, wind_risk, freeze_risk, storm_risk, visibility_risk };
  const details = generateDetails(weather, risks);
  const recommendation = generateRecommendation(overall);

  return {
    overall,
    score: Math.round(score * 10) / 10,
    rain_risk: Math.round(rain_risk * 10) / 10,
    wind_risk: Math.round(wind_risk * 10) / 10,
    freeze_risk: Math.round(freeze_risk * 10) / 10,
    storm_risk: Math.round(storm_risk * 10) / 10,
    visibility_risk: Math.round(visibility_risk * 10) / 10,
    recommendation,
    details,
  };
}

export function calculateGlobalRisk(segments: RouteSegment[]): MotoRiskScore {
  if (segments.length === 0) {
    return {
      overall: 'green',
      score: 0,
      rain_risk: 0,
      wind_risk: 0,
      freeze_risk: 0,
      storm_risk: 0,
      visibility_risk: 0,
      recommendation: 'Aucun segment a analyser.',
      details: [],
    };
  }

  const totalDistance = segments.reduce((sum, s) => sum + s.distance_km, 0);

  let weightedRain = 0;
  let weightedWind = 0;
  let weightedFreeze = 0;
  let weightedStorm = 0;
  let weightedVisibility = 0;

  for (const segment of segments) {
    const weight = totalDistance > 0 ? segment.distance_km / totalDistance : 1 / segments.length;
    weightedRain += segment.risk.rain_risk * weight;
    weightedWind += segment.risk.wind_risk * weight;
    weightedFreeze += segment.risk.freeze_risk * weight;
    weightedStorm += segment.risk.storm_risk * weight;
    weightedVisibility += segment.risk.visibility_risk * weight;
  }

  // Use the worst segment score as the dominant factor
  const worstScore = Math.max(...segments.map(s => s.risk.score));
  const avgScore = weightedRain * 0.35 + weightedWind * 0.25 + weightedFreeze * 0.20 + weightedStorm * 0.15 + weightedVisibility * 0.05;
  const score = clamp(avgScore * 0.4 + worstScore * 0.6, 0, 100);

  const hasAutoRed = segments.some(s => s.risk.overall === 'red');
  let overall = getOverallLevel(score);
  if (hasAutoRed) {
    overall = 'red';
  }

  const allDetails: string[] = [];
  const worstSegment = segments.reduce((worst, s) => s.risk.score > worst.risk.score ? s : worst, segments[0]!);
  allDetails.push(`Segment le plus risque : #${worstSegment.segment_index + 1} (score ${worstSegment.risk.score}).`);
  allDetails.push(...worstSegment.risk.details);

  return {
    overall,
    score: Math.round(score * 10) / 10,
    rain_risk: Math.round(weightedRain * 10) / 10,
    wind_risk: Math.round(weightedWind * 10) / 10,
    freeze_risk: Math.round(weightedFreeze * 10) / 10,
    storm_risk: Math.round(weightedStorm * 10) / 10,
    visibility_risk: Math.round(weightedVisibility * 10) / 10,
    recommendation: generateRecommendation(overall),
    details: allDetails,
  };
}
