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
import React, { useState, useEffect, useRef } from "react";
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

  const menuRef = useRef<HTMLDialogElement>(null);

  // Adjust route-associated state before committing a stale open dialog.
  const [previousPath, setPreviousPath] = useState(currentPath);
  if (previousPath !== currentPath) {
    setPreviousPath(currentPath);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setIsMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    const dialog = menuRef.current;
    if (isMenuOpen) dialog?.showModal();
    else dialog?.close();
    const previous = document.body.style.overflow;
    if (isMenuOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isMenuOpen]);

  return (
    <header className="sticky bg-base-100 py-2 top-0 z-50 border-b border-base-300 shadow-sm">
      <nav
        className="container mx-auto px-4 h-14 sm:h-16"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              aria-label="Home" 
              className="h-8 hover-scale focus-ring"
            >
              <Logo />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="btn btn-ghost p-2 sm:hidden hover-scale focus-ring"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <PiX className="text-2xl" aria-hidden="true" />
            ) : (
              <PiList className="text-2xl" aria-hidden="true" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-4">
            <AuthStatus currentPath={currentPath} />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <dialog
        ref={menuRef}
        onCancel={() => setIsMenuOpen(false)}
        onClose={() => setIsMenuOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first?.focus();
          }
        }}
        id="mobile-menu"
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-base-100 text-base-content p-0 border-0 backdrop:bg-black/40 sm:hidden"
        aria-label="Mobile menu"
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-base-300">
            <Link
              href="/"
              aria-label="Home"
              onClick={() => setIsMenuOpen(false)}
              className="h-8 hover-scale focus-ring"
            >
              <Logo />
            </Link>
            <button
              className="btn btn-ghost p-2 hover-scale focus-ring"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <PiX className="text-2xl" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <MobileAuthStatus
              currentPath={currentPath}
              onNavigate={() => setIsMenuOpen(false)}
            />
          </div>
        </div>
      </dialog>
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
      <div className="nav-links flex items-center gap-2">
        <Link href="/movies" className="btn btn-ghost">Discover</Link>
        <Link href="/community" prefetch={false} className="btn btn-ghost">Community</Link>
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
      <details className="dropdown dropdown-end">
        <summary
          className="btn btn-primary h-11 w-11 p-2"
          aria-label="Settings menu"
        >
          <PiGearBold className="text-xl" aria-hidden="true" />
        </summary>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content p-2 w-48 bg-base-100 shadow-lg rounded-lg"
        >
          <li><Link href="/diaries/new" prefetch={false}>New Diary</Link></li>
          <li><Link href="/settings/profile" prefetch={false}>Profile settings</Link></li>
          <li>
            <button
              className="btn btn-ghost justify-start h-10 text-base"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Log Out
            </button>
          </li>
        </ul>
      </details>
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
        <Link href="/movies" onClick={onNavigate} className="btn btn-ghost justify-start">Discover</Link>
        <Link href="/community" prefetch={false} onClick={onNavigate} className="btn btn-ghost justify-start">Community</Link>
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
      <Link href="/settings/profile" prefetch={false} onClick={onNavigate} className="btn btn-ghost justify-start">Profile settings</Link>
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
      label: "Community",
      href: "/community",
    },
    {
      icon: <PiNotebook aria-hidden="true" />,
      label: "My Diary",
      href: "/diaries",
    },
    {
      icon: <PiFilmSlate aria-hidden="true" />,
      label: "Discover",
      href: "/movies",
    },
  ];

  return (
    <div className="flex space-x-2">
      {links.map((link) => (
        <React.Fragment key={link.href}>
          <Link
            href={link.href}
            prefetch={false}
            className={`btn btn-primary h-11 px-6 text-base font-medium ${
              currentPath === link.href ? "btn-active" : ""
            }`}
            aria-current={currentPath === link.href ? "page" : undefined}
            onClick={onNavigate}
          >
            {link.label}
          </Link>
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
    {icon:<PiNotebook aria-hidden="true"/>,label:'Community',href:'/community'},
    {
      icon: <PiNotebook aria-hidden="true" />,
      label: "My Diary",
      href: "/diaries",
    },
    {
      icon: <PiFilmSlate aria-hidden="true" />,
      label: "Discover",
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
