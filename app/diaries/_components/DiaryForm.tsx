"use client";

import ErrorMessage from "@/app/components/ErrorMessage";
import Spinner from "@/app/components/Spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { FiImage } from "react-icons/fi";
import axios from "axios";

// --- Zod Schema ---
const diarySchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  date: z.string().min(1, "Date is required"),
  mood: z.string().min(1, "Mood is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type DiaryFormData = z.infer<typeof diarySchema>;

const DiaryForm = ({ diary }: { diary?: DiaryFormData & { id: string } }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(diary?.imageUrl || "");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    trigger,
    setValue,
  } = useForm<DiaryFormData>({
    resolver: zodResolver(diarySchema),
    defaultValues: {
      title: diary?.title || "",
      content: diary?.content || "",
      date: diary?.date || new Date().toISOString().slice(0, 10),
      mood: diary?.mood || "",
      imageUrl: diary?.imageUrl || "",
    },
  });

  const onSubmit = async (data: DiaryFormData) => {
    try {
      setIsSubmitting(true);
      if (diary) {
        await axios.patch("/api/diary/" + diary.id, data);
      } else {
        await axios.post("/api/diary", data);
      }
      router.push("/diary");
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setError("root", {
        type: "manual",
        message: "Something went wrong. Please try again.",
      });
    }
  };

  const handleImageUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    setPreviewImage(url);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-4">
          {diary ? "Edit Diary Entry" : "Create a Diary Entry"}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Left side form */}
            <div className="sm:col-span-2 space-y-8">
              <div className="card shadow-sm">
                <div className="card-body space-y-2">
                  <h2 className="card-title text-lg mb-4">Entry Details</h2>

                  {/* Title */}
                  <div className="form-control">
                    <label className="floating-label">
                      <span>Title</span>
                      <input
                        type="text"
                        {...register("title")}
                        className={`input input-bordered w-full ${errors.title ? "input-error" : ""}`}
                      />
                    </label>
                    <ErrorMessage>{errors.title?.message}</ErrorMessage>
                  </div>

                  {/* Date */}
                  <div className="form-control">
                    <label className="floating-label">
                      <span>Date</span>
                      <input
                        type="date"
                        {...register("date")}
                        className={`input input-bordered w-full ${errors.date ? "input-error" : ""}`}
                      />
                    </label>
                    <ErrorMessage>{errors.date?.message}</ErrorMessage>
                  </div>

                  {/* Mood */}
                  <div className="form-control">
                    <label className="floating-label">
                      <span>Mood</span>
                      <input
                        type="text"
                        placeholder="e.g., Happy, Anxious, Reflective"
                        {...register("mood")}
                        className={`input input-bordered w-full ${errors.mood ? "input-error" : ""}`}
                      />
                    </label>
                    <ErrorMessage>{errors.mood?.message}</ErrorMessage>
                  </div>

                  {/* Content */}
                  <div className="form-control">
                    <label className="floating-label">
                      <span>Content</span>
                      <textarea
                        placeholder="Write your thoughts..."
                        {...register("content")}
                        className={`textarea textarea-bordered h-32 resize-none w-full ${errors.content ? "textarea-error" : ""}`}
                      />
                    </label>
                    <ErrorMessage>{errors.content?.message}</ErrorMessage>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side image preview */}
            <div className="space-y-8">
              <div className="card shadow-sm">
                <div className="card-body space-y-2">
                  <h2 className="card-title text-lg mb-4">Optional Image</h2>

                  {/* Image URL */}
                  <div className="form-control">
                    <label className="floating-label">
                      <span>Image URL</span>
                      <input
                        type="url"
                        {...register("imageUrl")}
                        onBlur={handleImageUrlBlur}
                        className={`input input-bordered ${errors.imageUrl ? "input-error" : ""}`}
                      />
                    </label>
                    <ErrorMessage>{errors.imageUrl?.message}</ErrorMessage>
                  </div>

                  {/* Image Preview */}
                  <div className="mt-4">
                    <label className="label">
                      <span className="label-text font-semibold">Preview</span>
                    </label>
                    <div className="aspect-[4/3] bg-base-300 rounded-lg overflow-hidden border-2 border-dashed border-base-content/20">
                      {previewImage ? (
                        <Image
                          src={previewImage}
                          alt="Diary image preview"
                          width={300}
                          height={225}
                          className="w-full h-full object-cover"
                          onError={() => setPreviewImage("")}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-base-content/40">
                          <div className="text-center">
                            <FiImage className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">Image preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-start pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-md"
            >
              {diary ? "Update Entry" : "Submit Entry"}
              {isSubmitting && <Spinner />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiaryForm;
