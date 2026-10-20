// Test-process transport only; real localhost Wikidata mode does not load it.
const original=globalThis.fetch;
const item=id=>({mainsnak:{datavalue:{value:{id}}}});
const film=id=>({id,labels:{en:{value:id==='Q25188'?'Wikidata Fixture Film':id==='Q90001'?'Classic Fixture Film':id==='Q90002'?'Silent Classic Fixture Film':`Wikidata Film ${id}`}},descriptions:{en:{value:'An invented movie fixture'}},claims:{P31:[item('Q11424')],P136:[item('Q471839')],P57:[item('Q25191')],P3383:[{mainsnak:{datavalue:{value:'Wikidata fixture poster.png'}}}],P577:[{mainsnak:{datavalue:{value:{time:`+${(id==='Q90001'?1957:id==='Q90002'?1927:new Date().getUTCFullYear()-1)}-01-01T00:00:00Z`,precision:11}}}}]}});
globalThis.fetch=async(input,options)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 if(url.hostname==='query.wikidata.org'){const recent=(url.searchParams.get('query')||'').includes('LIMIT 240');return Response.json({results:{bindings:(recent?Array.from({length:61},(_,i)=>`Q${25188+i}`):['Q25188']).map(id=>({film:{value:`http://www.wikidata.org/entity/${id}`}}))}});}
 if(url.hostname==='commons.wikimedia.org')return Response.json({query:{pages:[{title:'File:Wikidata fixture poster.png',imagerepository:'local',imageinfo:[{width:1000,height:1500,mime:'image/png',thumburl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Wikidata_fixture_poster.png',descriptionurl:'https://commons.wikimedia.org/wiki/File:Wikidata_fixture_poster.png',extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'},Artist:{value:'Synthetic poster artist'}}}]}]}});
 if(url.origin!=='https://www.wikidata.org')return original(input,options);
 const query=url.searchParams.get('srsearch')||'';
 if(query.includes('Provider error'))return Response.json({}, {status:503});
 if(url.searchParams.get('list')==='search'&&url.searchParams.get('srlimit')==='240')return Response.json({query:{search:[{title:'Q90001'},{title:'Q90002'},{title:'Q25188'}]}});
 if(url.searchParams.get('list')==='search'){const id=url.searchParams.get('sroffset')==='12'?'Q25189':'Q25188';return Response.json({query:{searchinfo:{totalhits:query.includes('Empty')?0:24},search:query.includes('Empty')?[]:[{title:id}]}});}
 const ids=(url.searchParams.get('ids')||'').split('|');
 return Response.json({entities:Object.fromEntries(ids.map(id=>[id,url.searchParams.get('props')==='labels'?{id,labels:{en:{value:'Synthetic Wiki Director'}}}:film(id)]))});
};
