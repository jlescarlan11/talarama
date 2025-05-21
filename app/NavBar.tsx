"use client";
import { Avatar, Button, Flex } from "@radix-ui/themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiFilmSlate, PiHouse, PiNotebook } from "react-icons/pi";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const NavBar = () => {
  const currentPath = usePathname();

  const links = [
    { icon: <PiHouse />, label: `Dashboard`, href: "/" },
    { icon: <PiNotebook />, label: "Diary", href: "/diary" },
    { icon: <PiFilmSlate />, label: "Movie", href: "/movies" },
  ];

  return (
    <div className="shadow-sm mb-4">
      <nav className="p-8 flex items-center justify-between space-x-4 h-20">
        <Link href="/">
          <Logo />
        </Link>

        <Flex className="items-center" gap="6">
          <ul className="flex space-x-2 ">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant={link.href === currentPath ? "solid" : "soft"}>
                  {link.label}
                </Button>
              </Link>
            ))}
          </ul>
          <Flex>
            <Avatar
              src="https://images.usplash.com/photo-1502823403499-6ccfcf4fb453?&w=256&h=256&q=70&crop=focalpoint&fp-x=0.5&fp-y=0.3&fp-z=1&fit=crop"
              radius="full"
              size="2"
              fallback="A"
            />

            <ThemeToggle />
          </Flex>
        </Flex>
      </nav>
    </div>
  );
};

export default NavBar;
