import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../environments/environment';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    description: string;
    icon: string;
    main: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  name: string;
  sys: {
    sunrise: number;
    sunset: number;
    country: string;
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('rotate', [
      state('default', style({ transform: 'rotate(0)' })),
      state('rotated', style({ transform: 'rotate(360deg)' })),
      transition('default <=> rotated', animate('1000ms ease-out'))
    ]),
    trigger('pulse', [
      state('normal', style({ transform: 'scale(1)' })),
      state('pulsing', style({ transform: 'scale(1.05)' })),
      transition('normal <=> pulsing', animate('500ms ease-in-out'))
    ])
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white p-4 gradient-animate">
      <div class="max-w-7xl mx-auto py-8">
        <!-- Header with Weather Animation -->
        <div class="text-center mb-12" @fadeSlide>
          <div class="weather-animation mb-4">
            <div class="sun-moon" [class.night]="isNightTime()" [@rotate]="rotateState">
              <div class="circle"></div>
            </div>
          </div>
          <h1 class="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Weather Insights
          </h1>
          <p class="text-gray-300">{{getCurrentTime()}}</p>
        </div>
        
        <!-- Search Bar with Animation -->
        <div class="flex gap-4 mb-8 max-w-md mx-auto" @fadeSlide>
          <div class="relative flex-1 group">
            <input 
              type="text" 
              [(ngModel)]="city" 
              placeholder="Enter city name..." 
              class="w-full px-4 py-3 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 focus:outline-none focus:border-blue-500 text-white pl-10 transition-all duration-300 group-hover:bg-gray-800/70"
              (keyup.enter)="searchWeather()"
              [class.border-red-500]="error"
              [disabled]="isLoading"
            />
            <svg xmlns="http://www.w3.org/2000/svg" 
                 class="h-5 w-5 absolute left-3 top-3.5 text-gray-400 transition-transform duration-300 group-hover:scale-110" 
                 fill="none" 
                 viewBox="0 0 24 24" 
                 stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button 
            (click)="searchWeather()"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            [@pulse]="pulseState"
            [disabled]="isLoading"
          >
            <div class="flex items-center gap-2">
              <svg *ngIf="isLoading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{isLoading ? 'Searching...' : 'Search'}}
            </div>
          </button>
        </div>

        <!-- Error Message -->
        <div *ngIf="error" class="max-w-md mx-auto mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-center" @fadeSlide>
          {{error}}
        </div>

        <!-- Weather Display -->
        <ng-container *ngIf="!error">
          <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <!-- Main Weather Card -->
            <div class="bg-gray-800/40 backdrop-blur-md rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]" @fadeSlide>
              <div class="weather-icon mb-4 relative">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full filter blur-xl"></div>
                <img 
                  *ngIf="weatherIcon" 
                  [src]="'https://openweathermap.org/img/wn/' + weatherIcon + '@4x.png'"
                  class="w-32 h-32 mx-auto relative z-10"
                  alt="Weather icon"
                />
              </div>
              <div class="text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {{currentTemp}}°C
              </div>
              <div class="flex justify-center gap-4 mb-4">
                <span class="text-blue-400">↓ {{tempMin}}°C</span>
                <span class="text-red-400">↑ {{tempMax}}°C</span>
              </div>
              <div class="text-2xl capitalize mb-2">{{weatherDescription}}</div>
              <div class="text-gray-400 text-lg flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{city}}, {{country}}
              </div>
            </div>

            <!-- Weather Details -->
            <div class="grid grid-cols-2 gap-4" @fadeSlide>
              <!-- Feels Like -->
              <div class="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300">
                <div class="text-gray-400 mb-2">Feels Like</div>
                <div class="text-2xl font-semibold">{{feelsLike}}°C</div>
              </div>

              <!-- Humidity with Progress Bar -->
              <div class="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300">
                <div class="text-gray-400 mb-2">Humidity</div>
                <div class="text-2xl font-semibold mb-2">{{humidity}}%</div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div class="bg-blue-500 rounded-full h-2 transition-all duration-500"
                       [style.width]="humidity + '%'"></div>
                </div>
              </div>

              <!-- Wind Speed with Direction -->
              <div class="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300">
                <div class="text-gray-400 mb-2">Wind</div>
                <div class="text-2xl font-semibold">{{windSpeed}} m/s</div>
                <div class="mt-2">
                  <svg class="w-6 h-6 mx-auto transition-transform duration-500" 
                       [style.transform]="'rotate(' + windDeg + 'deg)'"
                       viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L9 9h6l-3-7zm0 20l3-7H9l3 7z"/>
                  </svg>
                </div>
              </div>

              <!-- Pressure with Trend -->
              <div class="bg-gray-800/40 backdrop-blur-md rounded-xl p-4 text-center transform hover:scale-105 transition-all duration-300">
                <div class="text-gray-400 mb-2">Pressure</div>
                <div class="text-2xl font-semibold">{{pressure}} hPa</div>
                <div class="text-sm" [class.text-green-400]="pressure > 1013" [class.text-red-400]="pressure < 1013">
                  {{pressure > 1013 ? '↑ High' : '↓ Low'}}
                </div>
              </div>
            </div>
          </div>

          <!-- Time Info with Dynamic Background -->
          <div class="mt-8 text-center text-gray-300" @fadeSlide>
            <div class="flex items-center justify-center gap-8">
              <div class="p-4 rounded-xl bg-gray-800/40 backdrop-blur-md transform hover:scale-105 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" 
                     class="h-8 w-8 mb-2 mx-auto text-yellow-500" 
                     fill="none" 
                     viewBox="0 0 24 24" 
                     stroke="currentColor"
                     [@rotate]="rotateState">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                </svg>
                <div>Sunrise</div>
                <div class="text-lg font-semibold">{{formatTime(sunrise)}}</div>
              </div>
              <div class="p-4 rounded-xl bg-gray-800/40 backdrop-blur-md transform hover:scale-105 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" 
                     class="h-8 w-8 mb-2 mx-auto text-orange-500" 
                     fill="none" 
                     viewBox="0 0 24 24" 
                     stroke="currentColor"
                     [@rotate]="rotateState">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <div>Sunset</div>
                <div class="text-lg font-semibold">{{formatTime(sunset)}}</div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit {
  city: string = 'London';
  currentTemp: number = 0;
  weatherDescription: string = 'Loading...';
  weatherIcon: string = '';
  feelsLike: number = 0;
  humidity: number = 0;
  windSpeed: number = 0;
  windDeg: number = 0;
  pressure: number = 0;
  sunrise: number = 0;
  sunset: number = 0;
  country: string = '';
  tempMin: number = 0;
  tempMax: number = 0;
  rotateState: string = 'default';
  pulseState: string = 'normal';
  isLoading: boolean = false;
  error: string | null = null;
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(private http: HttpClient) {
    setInterval(() => {
      this.rotateState = this.rotateState === 'default' ? 'rotated' : 'default';
    }, 10000);
  }

  ngOnInit() {
    this.searchWeather();
    setInterval(() => {
      this.pulseState = 'pulsing';
      setTimeout(() => this.pulseState = 'normal', 500);
    }, 5000);
  }

  searchWeather() {
    if (!this.city.trim()) {
      this.error = 'Please enter a city name';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const params = {
      q: this.city,
      appid: environment.apiKey,
      units: 'metric'
    };

    this.http.get<WeatherData>(`${this.apiUrl}`, { params })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.error = 'City not found. Please check the spelling and try again.';
          } else if (error.status === 401) {
            this.error = 'API key error. Please check your configuration.';
          } else {
            this.error = 'An error occurred while fetching weather data. Please try again.';
          }
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(data => {
        if (data) {
          this.currentTemp = Math.round(data.main.temp);
          this.weatherDescription = data.weather[0].description;
          this.weatherIcon = data.weather[0].icon;
          this.city = data.name;
          this.country = data.sys.country;
          this.feelsLike = Math.round(data.main.feels_like);
          this.humidity = data.main.humidity;
          this.windSpeed = Math.round(data.wind.speed * 10) / 10;
          this.windDeg = data.wind.deg;
          this.pressure = data.main.pressure;
          this.sunrise = data.sys.sunrise * 1000;
          this.sunset = data.sys.sunset * 1000;
          this.tempMin = Math.round(data.main.temp_min);
          this.tempMax = Math.round(data.main.temp_max);
        }
      });
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getCurrentTime(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  isNightTime(): boolean {
    const now = new Date().getTime();
    return now < this.sunrise || now > this.sunset;
  }
}
