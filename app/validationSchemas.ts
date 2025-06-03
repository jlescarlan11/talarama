import z from "zod";

const currentYear = new Date().getFullYear();

export const diaryEntrySchema = z.object({
  movieId: z.string().min(1, "Movie ID is required"),
  rating: z
    .number({
      required_error: "Rating is required",
      invalid_type_error: "Rating must be a number",
    })
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot be more than 10"),
  review: z
    .string()
    .min(10, "Review must be at least 10 characters long")
    .max(2000, "Review cannot exceed 2000 characters"),
  watchedDate: z
    .string()
    .min(1, "Watched date is required")
    .transform((date: Date) => {
      console.log("🔍 Validating date:", date);
      const parsedDate = new Date(date);
      console.log(
        "📅 Parsed date:",
        parsedDate,
        "Valid:",
        !isNaN(parsedDate.getTime())
      );

      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format");
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);
      console.log(
        "⏰ Today:",
        today,
        "Selected:",
        parsedDate,
        "Future?",
        parsedDate > today
      );

      if (parsedDate > today) {
        throw new Error("Watched date cannot be in the future");
      }

      return date; // Return original string for now
    }),
});

export const movieSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().min(1, "Description is required"),
  releasedYear: z
    .number({
      required_error: "Released year is required",
      invalid_type_error: "Released year must be a number",
    })
    .int()
    .min(1800, "Year must be 1800 or later")
    .max(currentYear, `Year cannot be after ${currentYear}`),
  duration: z
    .number({
      required_error: "Duration is required",
      invalid_type_error: "Duration must be a number",
    })
    .int()
    .positive("Duration must be a positive number"),
  posterUrl: z.string().url("Poster URL must be valid").optional(),
  directorFirstName: z
    .string()
    .min(1, "Director's first name is required")
    .max(55),
  directorLastName: z
    .string()
    .min(1, "Director's last name is required")
    .max(55),
  genres: z.array(z.string().min(1)).min(1, "At least one genre is required"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(5, { message: "Username must be at least 5 characters long" })
    .max(20, { message: "Username cannot exceed 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores",
    }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .max(100, { message: "Email cannot exceed 100 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(50, { message: "Password cannot exceed 50 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/, {
      message:
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
    }),
  confirmPassword: z.string(),
});
