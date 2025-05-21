import { Mansalva, Petit_Formal_Script } from "next/font/google";
import { PiFilmReel } from "react-icons/pi";

const mansalva = Mansalva({ subsets: ["latin"], weight: "400" });
const petitFormalScript = Petit_Formal_Script({
  subsets: ["latin"],
  weight: "400",
});

const Logo = () => {
  return (
    <div className="relative">
      <span
        className={`flex items-center relative text-2xl ${mansalva.className} z-10 font-bold`}
      >
        <PiFilmReel className=" fill-base size-6  stroke-1" />
        <span
          className="tracking-[-0.1em]"
          style={{
            display: "inline-block",
            position: "relative",
            transform: "skew(0.85deg)",
            transformOrigin: "center",
            backfaceVisibility: "hidden",
          }}
        >
          Talarama
        </span>
      </span>
    </div>
  );
};

export default Logo;
