import {listPublicEntries} from '@/app/services/publicEntryService';
import {json,communityError} from '@/app/lib/community/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{return json(await listPublicEntries({cursor:new URL(request.url).searchParams.get('cursor')??undefined}));}catch(e){return communityError(e);}}
