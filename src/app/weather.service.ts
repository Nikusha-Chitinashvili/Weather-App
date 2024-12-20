import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    temp_max: number;
    temp_min: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  name: string;
}

export interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
      deg: number;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private http: HttpClient) {}

  getCurrentWeather(city: string): Observable<WeatherData> {
    return this.http.get<WeatherData>(`${this.apiUrl}/weather`, {
      params: {
        q: city,
        units: 'metric',
        appid: environment.apiKey
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getForecast(city: string): Observable<ForecastData> {
    return this.http.get<ForecastData>(`${this.apiUrl}/forecast`, {
      params: {
        q: city,
        units: 'metric',
        appid: environment.apiKey
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 404:
          errorMessage = 'City not found';
          break;
        case 401:
          errorMessage = 'Invalid API key';
          break;
        case 429:
          errorMessage = 'Too many requests';
          break;
        default:
          errorMessage = 'Weather data unavailable';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
