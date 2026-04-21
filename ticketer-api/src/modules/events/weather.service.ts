import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface WeatherForecast {
  temperature: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  forecast_date: string;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    this.apiKey = this.configService.get<string>('OPENWEATHERMAP_API_KEY') || '';
  }

  async getEventWeather(
    latitude: number,
    longitude: number,
    eventDate: Date,
  ): Promise<WeatherForecast | null> {
    if (!this.apiKey) {
      this.logger.warn('OPENWEATHERMAP_API_KEY not set — returning stub weather data');
      return this.stubWeather(eventDate);
    }

    const cacheKey = `weather:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${eventDate.toISOString().split('T')[0]}`;

    // Check Redis cache first (TTL: 6 hours)
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as WeatherForecast;
    }

    try {
      const daysUntilEvent = Math.ceil(
        (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      let url: string;
      if (daysUntilEvent <= 5 && daysUntilEvent >= 0) {
        // Use 5-day forecast endpoint
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric&cnt=40`;
      } else {
        // Use current weather as a proxy for events in the past/far future
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        this.logger.warn(`OpenWeatherMap API error: ${res.status}`);
        return null;
      }

      const data = await res.json();
      let forecast: WeatherForecast;

      if (data.list) {
        // 5-day forecast — find the entry closest to event time
        const targetTime = eventDate.getTime();
        const closest = (data.list as any[]).reduce((best: any, item: any) => {
          const diff = Math.abs(item.dt * 1000 - targetTime);
          const bestDiff = Math.abs(best.dt * 1000 - targetTime);
          return diff < bestDiff ? item : best;
        });

        forecast = {
          temperature: Math.round(closest.main.temp),
          feels_like: Math.round(closest.main.feels_like),
          description: closest.weather[0].description,
          icon: closest.weather[0].icon,
          humidity: closest.main.humidity,
          wind_speed: Math.round(closest.wind.speed * 3.6), // m/s -> km/h
          forecast_date: new Date(closest.dt * 1000).toISOString(),
        };
      } else {
        // Current weather
        forecast = {
          temperature: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          humidity: data.main.humidity,
          wind_speed: Math.round(data.wind.speed * 3.6),
          forecast_date: new Date().toISOString(),
        };
      }

      // Cache for 6 hours
      await this.redis.set(cacheKey, JSON.stringify(forecast), 'EX', 6 * 60 * 60);
      return forecast;
    } catch (err) {
      this.logger.error('Failed to fetch weather', err);
      return null;
    }
  }

  private stubWeather(eventDate: Date): WeatherForecast {
    return {
      temperature: 28,
      feels_like: 31,
      description: 'partly cloudy',
      icon: '02d',
      humidity: 72,
      wind_speed: 14,
      forecast_date: eventDate.toISOString(),
    };
  }
}
