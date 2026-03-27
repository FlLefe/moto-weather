import axios from "axios";
import Constants from "expo-constants";

const baseURL =
  Constants.expoConfig?.extra?.apiUrl ?? "https://meteo.reforgelab.dev";

export const apiClient = axios.create({
  baseURL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});
