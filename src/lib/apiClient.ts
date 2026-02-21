import { BASE_URL } from "@/config/config";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});