import { getServerSession } from 'next-auth';
import authOptions from '../auth/authOptions';
import { listDiaryEntries } from '../services/diaryEntryService';
import DiaryHistory from './DiaryHistory';
export default async function MyDiaries(){const session=await getServerSession(authOptions);if(!session?.user?.id)return <p>Sign in to view your diary.</p>;const result=await listDiaryEntries(session.user.id);return <DiaryHistory entries={result.entries}/>;}
