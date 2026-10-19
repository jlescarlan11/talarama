import {getServerSession} from 'next-auth';
import {redirect} from 'next/navigation';
import authOptions from '@/app/auth/authOptions';
import ProfileForm from './ProfileForm';
export const dynamic='force-dynamic';
export const metadata={title:'Profile settings · Talarama',robots:{index:false,follow:false}};
export default async function ProfileSettings(){const session=await getServerSession(authOptions);if(!session?.user?.id)redirect('/api/auth/signin?callbackUrl=%2Fsettings%2Fprofile');return <ProfileForm/>;}
