// components/ClientTabs.tsx
"use client";
import { useState, ReactNode } from "react";
import WatchlistContent from "./WatchlistContent";

interface ClientTabsProps {
  favoritesContent: ReactNode;
  diariesContent: ReactNode;
  statisticsContent?: ReactNode;
}

const ClientTabs = ({
  favoritesContent,
  diariesContent,
  statisticsContent,
}: ClientTabsProps) => {
  const [activeTab, setActiveTab] = useState("favorites");

  return (
    <div className="w-full bg-base-100 rounded-lg shadow-md">
      <div role="tablist" className="tabs tabs-boxed bg-base-200 p-2">
        <button
          role="tab"
          className={`tab ${activeTab === "favorites" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          Favorites
        </button>
        <button
          role="tab"
          className={`tab ${activeTab === "diaries" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("diaries")}
        >
          My Diaries
        </button>
        <button
          role="tab"
          className={`tab ${activeTab === "watchlist" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("watchlist")}
        >
          Watchlist
        </button>
        <button
          role="tab"
          className={`tab ${activeTab === "statistics" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("statistics")}
        >
          Statistics
        </button>
      </div>

      {activeTab === "favorites" && (
        <div role="tabpanel" className="p-6">
          {favoritesContent}
        </div>
      )}

      {activeTab === "diaries" && (
        <div role="tabpanel" className="p-6">
          {diariesContent}
        </div>
      )}

      {activeTab === "watchlist" && (
        <div role="tabpanel" className="p-6">
          <WatchlistContent />
        </div>
      )}

      {activeTab === "statistics" && (
        <div role="tabpanel" className="p-6">
          {statisticsContent || (
            <>
              <h3 className="text-xl font-bold mb-4">Statistics</h3>
              <p>Your activity statistics would be shown here.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientTabs;
