"use client";
import { Link, Skeleton } from "@/app/components";
// import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { PiFilmSlate, PiGearBold, PiHouse, PiNotebook } from "react-icons/pi";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const NavBar = () => {
  // const currentPath = usePathname(); // to edit pa

  return (
    <div className="mb-4 flex container max-w-7xl mx-auto h-24">
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
    <div className="flex space-x-2 ">
      <div>
        <NavLinks />
      </div>
      {/* <div>
        <label className="input bg-primary text-primary-content">
          <PiMagnifyingGlassBold className="text-xl" />
          <input type="search" className="grow" placeholder="Search" />
        </label>
      </div> */}
      <div>
        <button className="btn btn-primary">
          <ThemeToggle />
        </button>
      </div>
      <div>
        <button className="btn btn-primary">
          <PiGearBold className="text-xl" />
        </button>
      </div>

      <div className="dropdown dropdown-end">
        {/* <NavLinks /> */}
        {/* <div
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
        </div> */}
        {/* <div tabIndex={0} className="menu menu-sm dropdown-content p-2 w-48">
          <span>{session!.user!.email!}</span>

          <ThemeToggle />
          <div className="nav-links">
            <button onClick={() => signOut({ callbackUrl: "/" })}>
              Log Out
            </button>
          </div>
        </div> */}
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
    <div className="flex space-x-2">
      {links.map((link) => (
        <button key={link.href} className="!cursor-pointer btn btn-primary">
          <Link href={link.href}>{link.label}</Link>
        </button>
      ))}
    </div>
  );
};

export default NavBar;
