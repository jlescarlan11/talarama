"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiFilmSlate, PiHouse, PiNotebook } from "react-icons/pi";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const NavBar = () => {
  const currentPath = usePathname(); // to edit pa

  const links = [
    { icon: <PiHouse />, label: `Dashboard`, href: "/" },
    { icon: <PiNotebook />, label: "Diary", href: "/diary" },
    { icon: <PiFilmSlate />, label: "Movie", href: "/movies" },
  ];

  return (
    <div className="shadow-sm mb-4 flex ">
      <nav className="navbar flex justify-between">
        <div>
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex gap-2">
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <Image
                alt="Picture of user"
                width={200}
                height={200}
                src="https://example.com/profile.png"
              />
            </div>
            <div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content p-2 w-48"
              >
                {links.map((link) => (
                  <li key={link.href} className="!cursor-pointer">
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
