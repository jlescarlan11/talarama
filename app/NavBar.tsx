import { Avatar, Flex } from "@radix-ui/themes";
import Link from "next/link";
import { PiFilmSlate, PiHouse, PiNotebook } from "react-icons/pi";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const NavBar = () => {
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

        <Flex className="items-center" gap="4">
          <ul className="flex  ">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className=" px-4 py-2 flex rounded-full items-center gap-2"
              >
                {link.label}
              </Link>
            ))}
          </ul>
          <Avatar
            src="https://images.usplash.com/photo-1502823403499-6ccfcf4fb453?&w=256&h=256&q=70&crop=focalpoint&fp-x=0.5&fp-y=0.3&fp-z=1&fit=crop"
            radius="full"
            size="2"
            fallback="A"
          />

          <ThemeToggle />
        </Flex>
      </nav>
    </div>
  );
};

export default NavBar;
