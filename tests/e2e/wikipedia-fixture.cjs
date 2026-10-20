// Synthetic transport only; the real local preview never loads this file.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./wikidata-fixture.cjs');
const original=globalThis.fetch;
globalThis.fetch=async(input,options)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 if(url.hostname==='commons.wikimedia.org')return Response.json({query:{pages:[]}});
 if(url.hostname==='en.wikipedia.org')return Response.json({query:{pages:url.searchParams.get('prop')==='imageinfo'?[{title:'File:Wikipedia fixture poster.jpg',imagerepository:'local',imageinfo:[{mime:'image/jpeg',extmetadata:{NonFree:{value:'true'},LicenseShortName:{value:'Fair use'}}}]}]:[{title:'Wikidata Fixture Film',pageprops:{wikibase_item:'Q25188'},pageimage:'Wikipedia fixture poster.jpg',thumbnail:{source:'https://upload.wikimedia.org/wikipedia/en/a/ab/Wikipedia_fixture_poster.jpg',width:220,height:330}}]}});
 const response=await original(input,options);
 if(url.hostname==='www.wikidata.org' && url.searchParams.get('props')?.includes('claims')){
  const data=await response.json();for(const entity of Object.values(data.entities||{}))entity.sitelinks={enwiki:{title:'Wikidata Fixture Film'}};return Response.json(data);
 }
 return response;
};
