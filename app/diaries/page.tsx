import { getServerSession } from 'next-auth';
import Link from 'next/link';
import Image from 'next/image';
import { PiBookOpenText, PiFilmSlate } from 'react-icons/pi';
import authOptions from '../auth/authOptions';
import EmptyState from '../components/EmptyState';
import Favorites from './Favorites';
import Watchlist from './Watchlist';
import ClientTabs from './ClientTabs';
import DiaryHistory from './DiaryHistory';
import { listDiaryEntries,parseDiaryFilters } from '@/app/services/diaryEntryService';
export default async function DiaryPage({searchParams}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}={}) {
 const session=await getServerSession(authOptions);
 if(!session?.user?.id)return <EmptyState title="Sign in to your diary" description="Keep track of the films you watch, your reviews, and your watchlist." href="/api/auth/signin?callbackUrl=%2Fdiaries" action="Sign in with Google"/>;
 const raw=await searchParams??{};const params=new URLSearchParams();for(const [key,value] of Object.entries(raw)){if(typeof value==='string')params.set(key,value);}
 let filters;try{filters=parseDiaryFilters(params);}catch{return <section className="space-y-4"><h1 className="text-3xl font-bold">Invalid diary filters</h1><Link className="btn" href="/diaries">Clear filters</Link></section>;}
 let result;
 try {result=await listDiaryEntries(session.user.id,filters);}catch(error){if(error instanceof Error && error.message==='Invalid diary cursor')return <section className="space-y-4"><h1 className="text-3xl font-bold">Invalid diary page</h1><Link className="btn" href="/diaries">Return to diary</Link></section>;throw error;}
 const overall=Object.keys(filters).some(key=>filters[key as keyof typeof filters]!==undefined)?await listDiaryEntries(session.user.id):result;
 const next=new URLSearchParams(params);if(result.nextCursor)next.set('cursor',result.nextCursor);next.set('tab','diaries');
 return <section className="max-w-6xl mx-auto space-y-6 pb-8">
  <nav aria-label="Breadcrumb" className="text-sm breadcrumbs"><ul><li><Link href="/">Home</Link></li><li>Diary</li></ul></nav>
  <header className="rounded-2xl shadow-lg p-6 sm:p-8 bg-base-200 flex flex-col lg:flex-row items-center gap-8">
   <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 min-w-0 flex-1">
    {session.user.image ? <Image src={session.user.image} alt="User profile" width={100} height={100} className="rounded-full border-3 border-primary shadow-lg"/> : <div aria-hidden="true" className="rounded-full w-24 h-24 bg-primary text-primary-content grid place-items-center text-4xl font-bold flex-shrink-0">{(session.user.username || session.user.name || 'M').slice(0,1).toUpperCase()}</div>}
    <div className="min-w-0 text-center sm:text-left"><p className="text-2xl font-bold text-primary break-words">{session.user.username || session.user.name}</p><h1 className="text-lg font-semibold">My Diary</h1><p className="text-sm text-base-content/70">{overall.statistics.logs} viewing logs · {overall.statistics.movies} distinct movies</p></div>
   </div>
   <div className="flex gap-6 sm:gap-10 text-center"><div><div className="flex items-center justify-center gap-2 text-primary"><PiBookOpenText aria-hidden="true" className="text-accent text-2xl"/><span className="text-3xl font-extrabold">{overall.statistics.logs}</span></div><p className="text-base-content/70">diary entries</p></div><div className="border-l border-base-content/30 pl-6 sm:pl-10"><div className="flex items-center justify-center gap-2 text-primary"><PiFilmSlate aria-hidden="true" className="text-accent text-2xl"/><span className="text-3xl font-extrabold">{overall.statistics.movies}</span></div><p className="text-base-content/70">distinct movies</p></div></div>
  </header>
  <div className="flex justify-end"><Link className="btn btn-primary" href="/diaries/new">Log a viewing</Link></div>
  <ClientTabs initialTab={params.get('tab')??'diaries'} favoritesContent={<Favorites/>} watchlistContent={<Watchlist/>} diariesContent={<div className="space-y-6">
   <form action="/diaries" className="grid gap-3 sm:grid-cols-4"><input type="hidden" name="tab" value="diaries"/>
    <label className="space-y-1"><span className="block text-sm">Search diary</span><input name="q" defaultValue={filters.q} maxLength={200} className="input w-full" placeholder="Movie title"/></label>
    <label className="space-y-1"><span className="block text-sm">Watched year</span><input name="year" defaultValue={filters.year} type="number" min="1" max="9998" className="input w-full" placeholder="All years"/></label>
    <label className="space-y-1"><span className="block text-sm">Rating filter</span><select name="rating" defaultValue={filters.rating??''} className="select w-full"><option value="">All ratings</option><option value="unrated">Not rated</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}/5</option>)}</select></label>
    <div className="flex gap-2 items-end"><button className="btn btn-primary" type="submit">Filter</button><Link className="btn btn-ghost" href="/diaries">Clear</Link></div>
   </form>
   <p className="text-sm text-base-content/70">{result.statistics.logs} matching logs · {result.statistics.movies} distinct movies. Your private diary is only visible to you.</p>
   <DiaryHistory entries={result.entries}/>
   <nav aria-label="Diary pagination" className="flex flex-wrap gap-3">{filters.cursor&&<Link className="btn btn-outline" href={'/diaries?'+new URLSearchParams([...params].filter(([key])=>key!=='cursor'))}>First page</Link>}{result.nextCursor&&<Link className="btn btn-outline" href={'/diaries?'+next}>Next page</Link>}</nav>
  </div>}/>
 </section>;
}
