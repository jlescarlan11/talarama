import {getServerSession} from 'next-auth';
import {notFound} from 'next/navigation';
import authOptions from '@/app/auth/authOptions';
import {requireAdmin} from '@/app/services/moderationService';
import ReportQueue from './ReportQueue';
export const dynamic='force-dynamic';
export const metadata={title:'Report queue · Talarama',robots:{index:false,follow:false}};
export default async function ReportsPage(){const session=await getServerSession(authOptions);if(!session?.user?.id)notFound();try{await requireAdmin(session.user.id);}catch{notFound();}return <ReportQueue/>;}
