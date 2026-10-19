import {getPublicReview} from '@/app/services/publicEntryService';
import {json,communityError} from '@/app/lib/community/http';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const review=await getPublicReview((await params).id);return review?json(review):json({error:'Not found'},404);}catch(e){return communityError(e);}}
