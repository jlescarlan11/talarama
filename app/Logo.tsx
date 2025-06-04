import Image from "next/image";
import AppLogo from "../public/appLogo.png";

const Logo = () => {
  return (
    <div className="flex items-center mt-2">
      <Image src={AppLogo} alt="App Logo" width={200} height={100} />
    </div>
  );
};

export default Logo;
