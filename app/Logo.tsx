import { Mansalva } from "next/font/google";
import { PiFilmReel } from "react-icons/pi";

const mansalva = Mansalva({ subsets: ["latin"], weight: "400" });

const Logo = () => {
  return (
    <div className="relative">
      <span
        className={`flex items-center relative text-2xl ${mansalva.className} z-10 font-bold`}
      >
        <PiFilmReel className=" fill-base size-6  stroke-1" />
        <span className="tracking-[-0.1em]">Talarama</span>
      </span>
    </div>
  );
};

export default Logo;
