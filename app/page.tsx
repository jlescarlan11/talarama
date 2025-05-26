"use client";
import { getServerSession } from "next-auth";
import { getSession, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div>
      <p>Signed in as {session?.user?.username}</p>
    </div>
  );
}
