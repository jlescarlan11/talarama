"use client";
import Image from "next/image";
import { Link } from "@/app/components";
import { usePathname } from "next/navigation";
import { PiFilmSlate, PiHouse, PiNotebook } from "react-icons/pi";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { useSession } from "next-auth/react";

const NavBar = () => {
  const currentPath = usePathname(); // to edit pa
  const { status, data: session } = useSession();

  const links = [
    { icon: <PiHouse />, label: `Dashboard`, href: "/" },
    { icon: <PiNotebook />, label: "Diary", href: "/diary" },
    { icon: <PiFilmSlate />, label: "Movie", href: "/movies" },
  ];

  return (
    <div className="shadow-sm mb-4 flex ">
      <nav className="navbar flex justify-between">
        <Link href="/">
          <Logo />
        </Link>

        <div className="flex gap-2">
          <div>
            {status === "authenticated" && (
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
                <div
                  tabIndex={0}
                  className="menu menu-sm dropdown-content p-2 w-48"
                >
                  <span>{session!.user!.email!}</span>
                  <ul>
                    {links.map((link) => (
                      <li key={link.href} className="!cursor-pointer">
                        <Link href={link.href}>{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                  <ThemeToggle />
                  <Link href="/api/auth/signout">Log out</Link>
                </div>
              </div>
            )}
            {status === "unauthenticated" && (
              <Link href="/api/auth/signin">Log in</Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
