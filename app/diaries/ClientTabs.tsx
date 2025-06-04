// components/ClientTabs.tsx
"use client";
import { useState, ReactNode } from "react";

interface ClientTabsProps {
  favoritesContent: ReactNode;
  diariesContent: ReactNode;
  watchlistContent?: ReactNode;
}

const ClientTabs = ({
  favoritesContent,
  diariesContent,
  watchlistContent,
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
          {watchlistContent || (
            <>
              <h3 className="text-xl font-bold mb-4">Watchlist</h3>
              <p>Items you&apos;re watching would appear here.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientTabs;
