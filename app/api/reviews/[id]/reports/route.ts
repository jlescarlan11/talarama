import {getServerSession} from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import {reportEntry,reportSchema} from '@/app/services/moderationService';
import {json,communityError} from '@/app/lib/community/http';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const session=await getServerSession(authOptions);if(!session?.user?.id)return json({error:'Unauthorized'},401);
 try{const {reason}=reportSchema.parse(await request.json());return json(await reportEntry(session.user.id,(await params).id,reason));}catch(e){return communityError(e);}
}
