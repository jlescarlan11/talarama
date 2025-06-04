// components/TabsContainer.tsx (Server Component)
import React, { Suspense } from "react";
import ClientTabs from "./ClientTabs";
import Favorites from "./Favorites";
import MyDiaries from "./MyDiaries";
import Watchlist from "./Watchlist";
import LoadingSpinner from "./LoadingSpinner";

const TabsContainer = () => {
  return (
    <ClientTabs
      favoritesContent={
        <Suspense fallback={<LoadingSpinner />}>
          <Favorites />
        </Suspense>
      }
      diariesContent={
        <Suspense fallback={<LoadingSpinner />}>
          <MyDiaries />
        </Suspense>
      }
      watchlistContent={
        <Suspense fallback={<LoadingSpinner />}>
          <Watchlist />
        </Suspense>
      }
    />
  );
};

export default TabsContainer;
