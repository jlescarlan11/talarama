import {getServerSession} from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import {listReports} from '@/app/services/moderationService';
import {json,communityError} from '@/app/lib/community/http';
export const dynamic='force-dynamic';
export async function GET(){const session=await getServerSession(authOptions);if(!session?.user?.id)return json({error:'Unauthorized'},401);try{return json(await listReports(session.user.id));}catch(e){return communityError(e);}}
