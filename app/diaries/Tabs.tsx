"use client";
import { useState } from "react";

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("favorites");

  return (
    <div className="w-full max-w-3xl bg-base-100 rounded-lg shadow-md">
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
          {/* Favorites content */}
          <h3 className="text-xl font-bold mb-4">Your Favorites</h3>
          <p>This is where your favorite items would appear.</p>
        </div>
      )}

      {activeTab === "diaries" && (
        <div role="tabpanel" className="p-6">
          {/* My Diaries content */}
          <h3 className="text-xl font-bold mb-4">My Diaries</h3>
          <p>Your diary entries would be displayed here.</p>
        </div>
      )}

      {activeTab === "watchlist" && (
        <div role="tabpanel" className="p-6">
          {/* Watchlist content */}
          <h3 className="text-xl font-bold mb-4">Watchlist</h3>
          <p>Items you&apos;re watching would appear here.</p>
        </div>
      )}

      {activeTab === "statistics" && (
        <div role="tabpanel" className="p-6">
          {/* Statistics content */}
          <h3 className="text-xl font-bold mb-4">Statistics</h3>
          <p>Your activity statistics would be shown here.</p>
        </div>
      )}
    </div>
  );
};

export default Tabs;
