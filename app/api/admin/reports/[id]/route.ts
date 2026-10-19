import {getServerSession} from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import {moderateReport} from '@/app/services/moderationService';
import {json,communityError} from '@/app/lib/community/http';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const session=await getServerSession(authOptions);if(!session?.user?.id)return json({error:'Unauthorized'},401);try{return json(await moderateReport(session.user.id,(await params).id,await request.json()));}catch(e){return communityError(e);}}
