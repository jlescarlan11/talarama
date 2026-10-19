import {getServerSession} from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import prisma from '@/prisma/client';
import {ownerProfileSelect,updateProfile} from '@/app/services/profileService';
import {json,communityError} from '@/app/lib/community/http';
export const dynamic='force-dynamic';
export async function GET(){
 const session=await getServerSession(authOptions);if(!session?.user?.id)return json({error:'Unauthorized'},401);
 try{const profile=await prisma.user.findUnique({where:{id:session.user.id},select:ownerProfileSelect});return profile?json(profile):json({error:'Not found'},404);}catch(e){return communityError(e);}
}
export async function PATCH(request:Request){
 const session=await getServerSession(authOptions);if(!session?.user?.id)return json({error:'Unauthorized'},401);
 try{return json(await updateProfile(session.user.id,await request.json()));}catch(e){return communityError(e);}
}
