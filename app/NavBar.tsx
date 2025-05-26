"use client";
import { Link, Skeleton } from "@/app/components";
import Image from "next/image";
// import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { PiFilmSlate, PiHouse, PiNotebook } from "react-icons/pi";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const NavBar = () => {
  // const currentPath = usePathname(); // to edit pa

  return (
    <div className="shadow-sm mb-4 flex ">
      <nav className="navbar flex justify-between">
        <Link href="/">
          <Logo />
        </Link>

        <AuthStatus />
      </nav>
    </div>
  );
};

const AuthStatus = () => {
  const { status, data: session } = useSession();

  if (status === "loading") return <Skeleton width="3rem" />;
  if (status === "unauthenticated")
    return (
      <div className="nav-links">
        <button onClick={() => signIn("google")}>Log in</button>
      </div>
    );

  return (
    <div>
      <div className="dropdown dropdown-end">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-ghost btn-circle avatar"
        >
          <Image
            alt="Picture of user"
            className="rounded-full"
            width={200}
            height={200}
            src={session!.user!.image!}
          />
        </div>
        <div tabIndex={0} className="menu menu-sm dropdown-content p-2 w-48">
          <span>{session!.user!.email!}</span>
          <NavLinks />
          <ThemeToggle />
          <div className="nav-links">
            <button onClick={() => signOut({ callbackUrl: "/" })}>
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
    { icon: <PiHouse />, label: `Dashboard`, href: "/" },
    { icon: <PiNotebook />, label: "Diary", href: "/diaries" },
    { icon: <PiFilmSlate />, label: "Movie", href: "/movies" },
  ];

  return (
    <ul>
      {links.map((link) => (
        <li key={link.href} className="!cursor-pointer nav-links">
          <Link href={link.href}>{link.label}</Link>
        </li>
      ))}
    </ul>
  );
};

export default NavBar;
