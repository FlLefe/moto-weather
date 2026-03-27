import { Router, Request, Response, NextFunction } from 'express';
import { getCurrentWeather, getHourlyWeather, getForecast } from '../services/weather.service.js';
import { calculateRiskScore } from '../services/risk.service.js';

const router = Router();

function validateLatLon(req: Request, res: Response): { lat: number; lon: number } | null {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    res.status(400).json({
      error: 'Parametres lat et lon invalides. lat doit etre entre -90 et 90, lon entre -180 et 180.',
    });
    return null;
  }

  return { lat, lon };
}

// GET /api/weather/current?lat=&lon=
router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coords = validateLatLon(req, res);
    if (!coords) return;

    const weather = await getCurrentWeather(coords.lat, coords.lon);
    const risk = calculateRiskScore(weather);

    res.json({ weather, risk });
  } catch (err) {
    next(err);
  }
});

// GET /api/weather/forecast?lat=&lon=&days=7
router.get('/forecast', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coords = validateLatLon(req, res);
    if (!coords) return;

    const days = Math.min(Math.max(parseInt(req.query.days as string, 10) || 7, 1), 16);
    const forecasts = await getForecast(coords.lat, coords.lon, days);

    // Compute risk summary for each daily forecast using a synthetic WeatherPoint
    const withRisk = forecasts.map(f => {
      const syntheticWeather = {
        lat: coords.lat,
        lon: coords.lon,
        timestamp: f.date,
        temperature: f.temp_min,
        feels_like: f.temp_min,
        precipitation: f.precipitation_sum,
        precipitation_probability: f.precipitation_sum > 0 ? 70 : 10,
        wind_speed: f.wind_speed_max * 0.7,
        wind_gusts: f.wind_speed_max,
        wind_direction: 0,
        is_freezing_risk: f.temp_min < 4,
        thunderstorm_risk: 0,
        visibility: 10,
        snow: 0,
        weather_code: f.weather_code,
      };
      return {
        ...f,
        risk_summary: calculateRiskScore(syntheticWeather),
      };
    });

    res.json({ forecasts: withRisk });
  } catch (err) {
    next(err);
  }
});

// GET /api/weather/hourly?lat=&lon=&date=YYYY-MM-DD
router.get('/hourly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coords = validateLatLon(req, res);
    if (!coords) return;

    const date = req.query.date as string;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Parametre date invalide. Format attendu : YYYY-MM-DD.' });
      return;
    }

    const hourlyData = await getHourlyWeather(coords.lat, coords.lon, date);
    const withRisk = hourlyData.map(weather => ({
      weather,
      risk: calculateRiskScore(weather),
    }));

    res.json({ hourly: withRisk });
  } catch (err) {
    next(err);
  }
});

export default router;
