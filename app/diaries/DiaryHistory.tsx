import GroupedDiaryEntriesWrapper from './GroupedDiaryEntriesWrapper';
import type { DiaryEntryWithMovie } from './types/diary';
export default function DiaryHistory({entries}:{entries:DiaryEntryWithMovie[]}) {return <GroupedDiaryEntriesWrapper entries={entries}/>;}
