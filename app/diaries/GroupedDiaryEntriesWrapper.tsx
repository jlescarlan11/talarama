"use client";

import React from "react";
import { DiaryEntryWithMovie } from "./types/diary";
import GroupedDiaryEntries from "./GroupedDiaryEntries";

interface GroupedDiaryEntriesWrapperProps {
  entries: DiaryEntryWithMovie[];
}

const GroupedDiaryEntriesWrapper: React.FC<GroupedDiaryEntriesWrapperProps> = ({
  entries,
}) => {
  return <GroupedDiaryEntries entries={entries} />;
};

export default GroupedDiaryEntriesWrapper; 