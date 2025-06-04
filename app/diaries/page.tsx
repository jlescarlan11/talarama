import React from "react";
import { PiNotebook } from "react-icons/pi";
import TabsContainer from "./TabsContainer";

const DiariesPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-accent/20 rounded-full p-2">
          <PiNotebook className="text-accent text-2xl" />
        </div>
        <h1 className="text-3xl font-bold text-white">My Diary</h1>
      </div>
      <TabsContainer />
    </div>
  );
};

export default DiariesPage;
