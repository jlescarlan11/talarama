import NextLink from "next/link";
import { ReactNode } from "react";

interface Props {
  href: string;
  children: ReactNode;
}

const Link = ({ href, children }: Props) => {
  return (
    <NextLink href={href} passHref>
      {children}
    </NextLink>
  );
};

export default Link;
