import { notFound } from 'next/navigation';
import DetailPage from '@/app/movies/_components/DetailPage';
import { wikidataIdSchema } from '@/app/lib/wikidata/client';
export default async function WikidataDetail({params}:{params:Promise<{wikidataId:string}>}) {
  const {wikidataId}=await params;if(!wikidataIdSchema.safeParse(wikidataId).success)notFound();
  return <DetailPage identity={{wikidataId}}/>;
}
