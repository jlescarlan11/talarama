import {notFound} from 'next/navigation';
import {getPublicProfile} from '@/app/services/publicEntryService';
import PublicView from '@/app/community/PublicView';
export const dynamic='force-dynamic';
export const metadata={title:'Member journal · Talarama',robots:{index:false,follow:false}};
export default async function MemberPage({params}:{params:Promise<{username:string}>}){const {username}=await params;if(!await getPublicProfile(username))notFound();return <PublicView key={username} endpoint={`/api/members/${encodeURIComponent(username)}`} kind="profile"/>;}
