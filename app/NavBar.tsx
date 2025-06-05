"use client";
import { Skeleton } from "@/app/components";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  PiFilmSlate,
  PiGearBold,
  PiNotebook,
  PiList,
  PiX,
} from "react-icons/pi";
import Logo from "./Logo";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavLink {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const NavBar: React.FC = () => {
  const currentPath = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky bg-info py-2 top-0 z-50 border-b border-info-content/20">
      <nav
        className="container max-w-7xl mx-auto px-4 h-14 sm:h-16"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Home" className="h-8">
              <Logo />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="btn btn-ghost p-2 sm:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <PiX className="text-2xl" />
            ) : (
              <PiList className="text-2xl" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-4">
            <AuthStatus currentPath={currentPath} />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 bg-info z-50 transform transition-transform duration-300 ease-in-out sm:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-info-content/20">
            <Link
              href="/"
              aria-label="Home"
              onClick={() => setIsMenuOpen(false)}
              className="h-8"
            >
              <Logo />
            </Link>
            <button
              className="btn btn-ghost p-2"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <PiX className="text-2xl" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <MobileAuthStatus
              currentPath={currentPath}
              onNavigate={() => setIsMenuOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

interface AuthStatusProps {
  currentPath: string;
  onNavigate?: () => void;
}

const AuthStatus: React.FC<AuthStatusProps> = ({ currentPath, onNavigate }) => {
  const { status } = useSession();

  if (status === "loading") return <Skeleton width="3rem" />;

  if (status === "unauthenticated")
    return (
      <div className="nav-links">
        <button
          onClick={() => signIn("google")}
          className="btn btn-primary h-11 px-6 text-base font-medium"
          aria-label="Log in with Google"
        >
          Log in
        </button>
      </div>
    );

  return (
    <div className="flex space-x-2">
      <div>
        <NavLinks currentPath={currentPath} onNavigate={onNavigate} />
      </div>
      <div className="dropdown dropdown-end">
        <button
          tabIndex={0}
          role="button"
          className="btn btn-primary h-11 w-11 p-2"
          aria-label="Settings menu"
          aria-expanded="false"
          aria-haspopup="true"
        >
          <PiGearBold className="text-xl" aria-hidden="true" />
        </button>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content p-2 w-48 bg-base-100 shadow-lg rounded-lg"
          role="menu"
        >
          <li role="none">
            <button
              className="btn btn-ghost justify-start h-10 text-base"
              onClick={() => signOut({ callbackUrl: "/" })}
              role="menuitem"
            >
              Log Out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

const MobileAuthStatus: React.FC<AuthStatusProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { status } = useSession();

  if (status === "loading") return <Skeleton width="3rem" />;

  if (status === "unauthenticated")
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => signIn("google")}
          className="btn btn-primary h-11 w-full text-base font-medium"
          aria-label="Log in with Google"
        >
          Log in
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <MobileNavLinks currentPath={currentPath} onNavigate={onNavigate} />
      <button
        className="btn btn-ghost justify-start h-11 w-full text-base"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Log Out
      </button>
    </div>
  );
};

interface NavLinksProps {
  currentPath: string;
  onNavigate?: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ currentPath, onNavigate }) => {
  const links: NavLink[] = [
    {
      icon: <PiNotebook aria-hidden="true" />,
      label: "Diary",
      href: "/diaries",
    },
    {
      icon: <PiFilmSlate aria-hidden="true" />,
      label: "Movie",
      href: "/movies",
    },
  ];

  return (
    <div className="flex space-x-2">
      {links.map((link, index) => (
        <React.Fragment key={link.href}>
          <Link
            href={link.href}
            className={`btn btn-primary h-11 px-6 text-base font-medium ${
              currentPath === link.href ? "btn-active" : ""
            }`}
            aria-current={currentPath === link.href ? "page" : undefined}
            onClick={onNavigate}
          >
            {link.label}
          </Link>
          {index === 0 && (
            <Link
              href="/diaries/new"
              className="btn btn-primary h-11 px-6 text-base font-medium"
              aria-label="Create new diary entry"
              onClick={onNavigate}
            >
              New Diary
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const MobileNavLinks: React.FC<NavLinksProps> = ({
  currentPath,
  onNavigate,
}) => {
  const links: NavLink[] = [
    {
      icon: <PiNotebook aria-hidden="true" />,
      label: "Diary",
      href: "/diaries",
    },
    {
      icon: <PiFilmSlate aria-hidden="true" />,
      label: "Movie",
      href: "/movies",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {links.map((link, index) => (
        <React.Fragment key={link.href}>
          <Link
            href={link.href}
            className={`btn btn-primary h-11 w-full justify-start text-base font-medium ${
              currentPath === link.href ? "btn-active" : ""
            }`}
            aria-current={currentPath === link.href ? "page" : undefined}
            onClick={onNavigate}
          >
            {link.icon}
            <span className="ml-2">{link.label}</span>
          </Link>
          {index === 0 && (
            <Link
              href="/diaries/new"
              className="btn btn-primary h-11 w-full justify-start text-base font-medium"
              aria-label="Create new diary entry"
              onClick={onNavigate}
            >
              <PiNotebook className="text-xl" aria-hidden="true" />
              <span className="ml-2">New Diary</span>
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default NavBar;
