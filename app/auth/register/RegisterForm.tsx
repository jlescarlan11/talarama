"use client";
import { ErrorMessage, Spinner } from "@/app/components";
import { registerSchema } from "@/app/validationSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LuKey, LuMail, LuUser } from "react-icons/lu";
import { z } from "zod";

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsSubmitting(true);
      await axios.post("/api/auth/register", data);
      router.push("api/auth/signin");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError("root", {
          message: error.response?.data?.error || "Registration failed",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-control">
          <label className="input input-bordered flex items-center gap-2">
            <LuUser className="w-4 h-4 opacity-70" />
            <input
              type="text"
              placeholder="Username"
              {...register("username")}
              className="grow"
            />
          </label>
          <ErrorMessage>{errors.username?.message}</ErrorMessage>
        </div>

        <div className="form-control">
          <label className="input input-bordered flex items-center gap-2">
            <LuMail className="w-4 h-4 opacity-70" />
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="grow"
            />
          </label>
          <ErrorMessage>{errors.email?.message}</ErrorMessage>
        </div>

        <div className="form-control">
          <label className="input input-bordered flex items-center gap-2">
            <LuKey className="w-4 h-4 opacity-70" />
            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="grow"
            />
          </label>
          <ErrorMessage>{errors.password?.message}</ErrorMessage>
        </div>

        <div className="form-control">
          <label className="input input-bordered flex items-center gap-2">
            <LuKey className="w-4 h-4 opacity-70" />
            <input
              type="password"
              placeholder="Confirm Password"
              {...register("confirmPassword")}
              className="grow"
            />
          </label>
          <ErrorMessage>{errors.confirmPassword?.message}</ErrorMessage>
        </div>

        {errors.root && (
          <ErrorMessage className="mt-4">{errors.root.message}</ErrorMessage>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary mt-4"
        >
          Create Account {isSubmitting && <Spinner />}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
