import Image from "next/image";
import AppLogo from "../public/appLogo.png";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center mt-2">
      <Image src={AppLogo} alt="App Logo" width={200} height={100} />
    </Link>
  );
};

export default Logo;
