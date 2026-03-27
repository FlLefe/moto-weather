import { Router, Request, Response, NextFunction } from 'express';
import { getRouteSegments } from '../services/routing.service.js';
import { getWeatherAtTime, getHourlyWeather } from '../services/weather.service.js';
import { calculateRiskScore, calculateGlobalRisk } from '../services/risk.service.js';
import type { RouteWeatherAnalysis, GearCheck } from '../types/index.js';

const router = Router();

// POST /api/route/analyze
router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin, destination, departure_time } = req.body as {
      origin: { lat: number; lon: number; label: string };
      destination: { lat: number; lon: number; label: string };
      departure_time: string;
    };

    if (!origin || !destination || !departure_time) {
      res.status(400).json({
        error: 'Champs requis : origin {lat, lon, label}, destination {lat, lon, label}, departure_time.',
      });
      return;
    }

    if (
      typeof origin.lat !== 'number' || typeof origin.lon !== 'number' ||
      typeof destination.lat !== 'number' || typeof destination.lon !== 'number'
    ) {
      res.status(400).json({ error: 'Les coordonnees lat/lon doivent etre des nombres.' });
      return;
    }

    // 1. Get route segments from OSRM
    const { segments, totalDistanceKm, totalDurationMin } = await getRouteSegments(
      origin,
      destination,
      departure_time,
    );

    // 2. For each segment, get weather at midpoint + ETA
    for (const segment of segments) {
      const midLat = (segment.start_coords.lat + segment.end_coords.lat) / 2;
      const midLon = (segment.start_coords.lon + segment.end_coords.lon) / 2;

      const weather = await getWeatherAtTime(midLat, midLon, segment.estimated_arrival);
      segment.weather = weather;

      // 3. Calculate risk for each segment
      segment.risk = calculateRiskScore(weather);
    }

    // 4. Calculate global risk
    const globalRisk = calculateGlobalRisk(segments);

    // 5. Gear recommendation
    const maxPrecipProb = Math.max(...segments.map(s => s.weather.precipitation_probability));
    const minTemp = Math.min(...segments.map(s => s.weather.temperature));
    const rainGear = maxPrecipProb > 30 || segments.some(s => s.weather.precipitation > 0);
    const warmLayers = minTemp < 15;
    const confidence = segments.length > 0 ? Math.min(95, 70 + segments.length * 3) : 50;

    const analysis: RouteWeatherAnalysis = {
      departure: departure_time,
      origin,
      destination,
      total_distance_km: totalDistanceKm,
      total_duration_min: totalDurationMin,
      segments,
      global_risk: globalRisk,
      gear_recommendation: {
        rain_gear: rainGear,
        warm_layers: warmLayers,
        confidence,
      },
    };

    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

// GET /api/route/gear-check?lat=&lon=&date=YYYY-MM-DD&return_hour=HH
router.get('/gear-check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const date = req.query.date as string;
    const returnHour = parseInt(req.query.return_hour as string, 10);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Parametres lat/lon invalides.' });
      return;
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Parametre date invalide. Format attendu : YYYY-MM-DD.' });
      return;
    }

    if (isNaN(returnHour) || returnHour < 6 || returnHour > 23) {
      res.status(400).json({ error: 'Parametre return_hour invalide. Doit etre entre 6 et 23.' });
      return;
    }

    const hourlyData = await getHourlyWeather(lat, lon, date);

    // Filter hours from 6h to return_hour
    const relevantHours = hourlyData.filter(w => {
      const hour = new Date(w.timestamp).getHours();
      return hour >= 6 && hour <= returnHour;
    });

    if (relevantHours.length === 0) {
      res.status(400).json({ error: 'Aucune donnee meteo disponible pour la plage horaire demandee.' });
      return;
    }

    // Calculate risk for each hour and find worst
    let worstRisk = calculateRiskScore(relevantHours[0]!);
    let worstPeriod = relevantHours[0]!.timestamp;

    for (const weather of relevantHours) {
      const risk = calculateRiskScore(weather);
      if (risk.score > worstRisk.score) {
        worstRisk = risk;
        worstPeriod = weather.timestamp;
      }
    }

    const maxPrecipProb = Math.max(...relevantHours.map(w => w.precipitation_probability));
    const minTemp = Math.min(...relevantHours.map(w => w.temperature));

    const gearCheck: GearCheck = {
      rain_gear: maxPrecipProb > 30 || relevantHours.some(w => w.precipitation > 0),
      warm_layers: minTemp < 15,
      worst_period: worstPeriod,
      risk: worstRisk,
      confidence: Math.min(95, 60 + relevantHours.length * 2),
    };

    res.json(gearCheck);
  } catch (err) {
    next(err);
  }
});

export default router;
