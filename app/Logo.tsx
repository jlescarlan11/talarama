import { Button, Flex, Text } from "@radix-ui/themes";
import { Mansalva } from "next/font/google";
import { PiFilmReel } from "react-icons/pi";

const mansalva = Mansalva({ subsets: ["latin"], weight: "400" });

const Logo = () => {
  return (
    <Button
      variant="ghost"
      className="!bg-transparent hover:!bg-transparent !cursor-pointer"
    >
      <Flex align="center" className="text-2xl px-4 py-2 ">
        <PiFilmReel />
        <Text className={`${mansalva.className} !tracking-tighter`}>
          Talarama
        </Text>
      </Flex>
    </Button>
  );
};

export default Logo;
