export const apiKeys = {
  openWeather: import.meta.env.VITE_OPENWEATHER_API_KEY?.trim() ?? "",
  gemini: import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? "",
};

export const hasApiKey = {
  openWeather: apiKeys.openWeather.length > 0,
  gemini: apiKeys.gemini.length > 0,
};
