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

export const diarySchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  content: z.string().min(1, "Content is required"),
  date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Date must be a valid date string" }
  ),
  mood: z.string().min(1, "Mood is required").max(50, "Mood is too long"),
});

const registerBaseSchema = z.object({
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

type RegisterSchemaType = z.infer<typeof registerBaseSchema>;

export const registerSchema = registerBaseSchema.refine(
  (data: RegisterSchemaType) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);
