import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { registerSchema } from "@/app/validationSchemas";

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6), // Match frontend's 6 char minimum
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const validation = schema.safeParse(body);
  if (!validation.success)
    return NextResponse.json(validation.error.errors, { status: 400 });

  const { data } = validation;

  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (user)
    return NextResponse.json({ error: "User already exists" }, { status: 400 });

  const hashedPassword = await bcrypt.hash(body.password, 10);

  await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      hashedPassword,
    },
  });

  return NextResponse.json({ email: body.email });
}
