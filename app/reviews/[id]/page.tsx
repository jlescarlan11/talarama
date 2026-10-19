import {notFound} from 'next/navigation';
import {getPublicReview} from '@/app/services/publicEntryService';
import PublicView from '@/app/community/PublicView';
export const dynamic='force-dynamic';
export const metadata={title:'Member review · Talarama',robots:{index:false,follow:false}};
export default async function ReviewPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!await getPublicReview(id))notFound();return <PublicView key={id} endpoint={`/api/reviews/${encodeURIComponent(id)}`} kind="review"/>;}
