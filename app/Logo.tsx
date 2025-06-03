import { Mansalva } from "next/font/google";
import { PiFilmReel } from "react-icons/pi";

const mansalva = Mansalva({ subsets: ["latin"], weight: "400" });

const Logo = () => {
  return (
    <button className="border-none shadow-none !bg-transparent hover:!bg-transparent">
      <div className="flex  items-center text-2xl  ">
        <PiFilmReel />
        <p className={`${mansalva.className} !tracking-[-0.1em]`}>Talarama</p>
      </div>
    </button>
  );
};

export default Logo;
