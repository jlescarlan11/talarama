"use client";
import { Link, Skeleton } from "@/app/components";
// import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { PiFilmSlate, PiGearBold, PiNotebook } from "react-icons/pi";
import Logo from "./Logo";
import React from "react";

const NavBar = () => {
  // const currentPath = usePathname(); // to edit pa

  return (
    <div className="mb-4 flex container max-w-7xl mx-auto h-24">
      <nav className="navbar flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <AuthStatus />
        </div>
      </nav>
    </div>
  );
};

const AuthStatus = () => {
  const { status } = useSession();

  if (status === "loading") return <Skeleton width="3rem" />;
  if (status === "unauthenticated")
    return (
      <div className="nav-links">
        <button onClick={() => signIn("google")}>Log in</button>
      </div>
    );

  return (
    <div className="flex space-x-2 ">
      <div>
        <NavLinks />
      </div>
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-primary">
          <PiGearBold className="text-xl" />
        </div>
        <div
          tabIndex={0}
          className="menu menu-sm dropdown-content p-2 w-48 bg-base-100 shadow-lg rounded-box"
        >
          <div className="flex flex-col gap-2">
            <button
              className="btn btn-ghost justify-start"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavLinks = () => {
  const links = [
    { icon: <PiNotebook />, label: "Diary", href: "/diaries" },
    { icon: <PiFilmSlate />, label: "Movie", href: "/movies" },
  ];

  return (
    <div className="flex space-x-2">
      {links.map((link, index) => (
        <React.Fragment key={link.href}>
          <button className="!cursor-pointer btn btn-primary">
            <Link href={link.href}>{link.label}</Link>
          </button>
          {index === 0 && (
            <button className="!cursor-pointer btn btn-primary">
              <Link href="/diaries/new">New Diary</Link>
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default NavBar;
