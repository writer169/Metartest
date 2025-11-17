
import React, { useState, useEffect } from 'react';

const WEATHER_STATION_URL = 'https://api.allorigins.win/raw?url=https://tgftp.nws.noaa.gov/data/observations/metar/stations/UAAA.TXT';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-center">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mb-4"></div>
    <p className="text-xl text-slate-300">Fetching Weather Data...</p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center bg-red-900/50 border border-red-600 p-6 rounded-lg max-w-lg">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
        <p className="text-slate-300">{message}</p>
    </div>
);

const TemperatureDisplay: React.FC<{ temperature: string }> = ({ temperature }) => (
    <div className="text-center">
        <p className="text-2xl text-slate-400 font-light">Current Temperature at Station</p>
        <h1 className="text-4xl text-cyan-400 font-bold mb-4">UAAA</h1>
        <div className="relative">
            <span className="text-9xl md:text-[12rem] font-extrabold text-white tracking-tighter">
                {temperature}
            </span>
            <span className="absolute top-4 -right-10 md:-right-16 text-5xl md:text-7xl font-light text-slate-400">°C</span>
        </div>
    </div>
);


const App: React.FC = () => {
  const [temperature, setTemperature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Using a CORS proxy to bypass browser security restrictions on direct requests.
        const response = await fetch(WEATHER_STATION_URL);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const metarData = await response.text();

        // METAR format example: UAAA 250500Z 15004MPS 9999 BKN030 15/09 Q1015 ...
        // The temperature/dew point group is typically in format TT/DD or MTT/MDD
        // This regex finds the temperature part (the part before the slash).
        const tempMatch = metarData.match(/\s(M?\d{2})\/(M?\d{2})?\s/);

        if (tempMatch && tempMatch[1]) {
          let tempStr = tempMatch[1];
          // Handle negative temperatures prefixed with 'M'
          if (tempStr.startsWith('M')) {
            tempStr = '-' + tempStr.substring(1);
          } else {
             // remove leading zero for positive temps
             tempStr = parseInt(tempStr, 10).toString();
          }
          setTemperature(tempStr);
        } else {
          throw new Error('Could not parse temperature from the METAR data.');
        }
      } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred.');
        }
        console.error("Error fetching weather data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-900 text-white font-sans">
      <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="flex items-center justify-center">
            {isLoading && <LoadingSpinner />}
            {error && <ErrorDisplay message={error} />}
            {!isLoading && !error && temperature && <TemperatureDisplay temperature={temperature} />}
        </div>
      </div>
    </main>
  );
};

export default App;
