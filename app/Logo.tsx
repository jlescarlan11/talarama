import Image from "next/image";
import AppLogo from "../public/appLogo.png";

const Logo = () => {
  return (
    <div className="flex items-center">
      <Image src={AppLogo} alt="App Logo" width={100} height={50} />
    </div>
  );
};

export default Logo;
