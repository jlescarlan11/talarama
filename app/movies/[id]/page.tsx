import { notFound } from 'next/navigation';
import DetailPage from '../_components/DetailPage';
export default async function LocalMoviePage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 if (!id || id.length > 200) notFound();
 return <DetailPage identity={{ localId: id }} />;
}
