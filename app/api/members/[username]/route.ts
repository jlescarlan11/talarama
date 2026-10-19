import {getPublicProfile} from '@/app/services/publicEntryService';
import {json,communityError} from '@/app/lib/community/http';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{username:string}>}){try{const {username}=await params;const profile=await getPublicProfile(username,{cursor:new URL(request.url).searchParams.get('cursor')??undefined});return profile?json(profile):json({error:'Not found'},404);}catch(e){return communityError(e);}}
