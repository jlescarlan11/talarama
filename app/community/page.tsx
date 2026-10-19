import PublicView from './PublicView';
export const dynamic='force-dynamic';
export const metadata={title:'Community · Talarama',description:'Public movie journals and reviews shared by members.'};
export default function CommunityPage(){return <div className="max-w-[48rem] mx-auto space-y-6"><header className="space-y-3"><p className="text-primary uppercase tracking-widest text-sm font-semibold">Shared movie journals</p><h1 className="text-4xl font-bold">Community</h1><p>Recent public viewings, ratings and reviews. A new film, a familiar favorite, another perspective.</p></header><PublicView endpoint="/api/community" kind="feed"/></div>;}
