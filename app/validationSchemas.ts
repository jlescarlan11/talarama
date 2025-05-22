import z from "zod";

const currentYear = new Date().getFullYear();

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
