import axios, { AxiosError } from "axios";
import type { DiaryCreatePayload } from "../types/diary";

class DiaryService {
  async createEntry(payload: DiaryCreatePayload) {
    const response = await axios.post("/api/diaries", payload);
    return response.data;
  }

  async updateEntry(id: string, payload: DiaryCreatePayload) {
    const response = await axios.patch(`/api/diaries/${id}`, payload);
    return response.data;
  }

  getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: string }>;
      const status = axiosError.response?.status;
      const errorMessage = axiosError.response?.data?.error;

      const errorMessages: Record<number, string> = {
        400: "Validation failed. Please check your input.",
        401: "You must be logged in to create diary entries.",
        404: "Movie or user not found.",
        409: "You have already logged this movie for this date.",
        429: "Too many requests. Please try again later.",
        500: "Server error. Please try again later.",
      };

      return (
        errorMessages[status ?? 0] ??
        errorMessage ??
        "An unexpected error occurred"
      );
    }

    return "Network error - please check your connection";
  }
}

export const diaryService = new DiaryService();
