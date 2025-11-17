import React, { useState, useEffect, useCallback } from 'react';

const WEATHER_STATION_URL = 'https://corsproxy.io/?https://tgftp.nws.noaa.gov/data/observations/metar/stations/UAAA.TXT';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-center">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mb-4"></div>
    <p className="text-xl text-slate-300">Загрузка данных...</p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center bg-red-900/50 border border-red-600 p-6 rounded-lg max-w-lg">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Ошибка</h2>
        <p className="text-slate-300">{message}</p>
    </div>
);

const App: React.FC = () => {
  const [temperature, setTemperature] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(WEATHER_STATION_URL);
      if (!response.ok) {
        throw new Error(`Ошибка сети: ${response.status} ${response.statusText}`);
      }
      const metarData = await response.text();

      // Парсинг температуры
      const tempMatch = metarData.match(/\s(M?\d{2})\/(M?\d{2})?\s/);
      if (tempMatch && tempMatch[1]) {
        let tempStr = tempMatch[1];
        tempStr = tempStr.startsWith('M') ? '-' + tempStr.substring(1) : parseInt(tempStr, 10).toString();
        setTemperature(tempStr);
      } else {
        throw new Error('Не удалось получить данные о температуре из METAR.');
      }

      // Парсинг даты и времени (DDHHMMZ)
      const dateMatch = metarData.match(/(\d{2})(\d{2})(\d{2})Z/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const hour = parseInt(dateMatch[2], 10);
        const minute = parseInt(dateMatch[3], 10);
        
        const now = new Date();
        const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, hour, minute));

        // Коррекция месяца, если день в отчете больше текущего (например, 1-е число месяца, а отчет за 31-е)
        if (utcDate > now) {
            utcDate.setUTCMonth(utcDate.getUTCMonth() - 1);
        }
        setLastUpdated(utcDate);
      } else {
        setLastUpdated(null);
      }

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Произошла неизвестная ошибка.');
      }
      console.error("Ошибка при загрузке данных о погоде:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const formatUpdateTime = (date: Date | null): string => {
    if (!date) return '';
    // Форматирование даты для таймзоны UTC+5 (Алматы)
    return new Intl.DateTimeFormat('ru-RU', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Almaty'
    }).format(date);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-900 text-white">
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-10 text-center">
        {isLoading && <LoadingSpinner />}
        {error && <ErrorDisplay message={error} />}
        {!isLoading && !error && temperature && (
          <div className="flex flex-col items-center">
            <p className="text-lg sm:text-xl text-slate-400 font-light">Температура на станции</p>
            <h1 className="text-3xl sm:text-4xl text-cyan-400 font-bold mb-4">UAAA</h1>
            <div className="relative my-4">
              <span className="text-8xl sm:text-9xl md:text-[10rem] font-extrabold text-white tracking-tighter">
                {temperature}
              </span>
              <span className="absolute top-2 -right-8 sm:-right-12 text-4xl sm:text-5xl font-light text-slate-400">°C</span>
            </div>
            {lastUpdated && (
              <p className="text-sm text-slate-500 mt-2">
                Обновлено: {formatUpdateTime(lastUpdated)}
              </p>
            )}
            <button
              onClick={fetchWeatherData}
              disabled={isLoading}
              className="mt-8 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-transform transform active:scale-95 duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
              aria-label="Обновить данные о погоде"
            >
              Обновить
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default App;
