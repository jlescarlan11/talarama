// components/ClientTabs.tsx
"use client";
import { useState, ReactNode } from "react";

interface ClientTabsProps {
  favoritesContent: ReactNode;
  diariesContent: ReactNode;
  watchlistContent?: ReactNode;
}

const tabList = [
  { key: "favorites", label: "Favorites" },
  { key: "diaries", label: "My Diary" },
  { key: "watchlist", label: "Watchlist" },
];

const ClientTabs = ({
  favoritesContent,
  diariesContent,
  watchlistContent,
}: ClientTabsProps) => {
  const [activeTab, setActiveTab] = useState("favorites");

  return (
    <div className="w-full rounded-2xl bg-base-200 shadow-lg">
      <div
        role="tablist"
        className="grid grid-cols-3 p-4 bg-base-300 rounded-t-2xl"
      >
        {tabList.map((tab) => (
          <div key={tab.key} className="relative flex justify-center">
            <button
              role="tab"
              className={`w-1/2 px-6 py-2 rounded-full font-semibold transition-all duration-150 text-base-content/80 hover:text-base-content focus:outline-none focus:ring-2 focus:ring-primary ${
                activeTab === tab.key
                  ? "bg-primary text-primary-content shadow-md"
                  : "bg-transparent hover:bg-base-100"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          </div>
        ))}
      </div>
      <div className="p-6 bg-base-100 rounded-b-2xl">
        {activeTab === "favorites" && favoritesContent}
        {activeTab === "diaries" && diariesContent}
        {activeTab === "watchlist" &&
          (watchlistContent || (
            <div className="text-center text-base-content/60">
              No watchlist items yet.
            </div>
          ))}
      </div>
    </div>
  );
};

export default ClientTabs;
