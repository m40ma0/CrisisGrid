export const apiKeys = {
  googleMaps: import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? "",
  openWeather: import.meta.env.VITE_OPENWEATHER_API_KEY?.trim() ?? "",
  gemini: import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? "",
};

export const hasApiKey = {
  googleMaps: apiKeys.googleMaps.length > 0,
  openWeather: apiKeys.openWeather.length > 0,
  gemini: apiKeys.gemini.length > 0,
};
