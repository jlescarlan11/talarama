// Test-process transport only; real localhost Wikidata mode does not load it.
const original=globalThis.fetch;
const item=id=>({mainsnak:{datavalue:{value:{id}}}});
const film=id=>({id,labels:{en:{value:id==='Q25188'?'Wikidata Fixture Film':'Wikidata Second Film'}},descriptions:{en:{value:'An invented movie fixture'}},claims:{P31:[item('Q11424')],P136:[item('Q471839')],P57:[item('Q25191')],P577:[{mainsnak:{datavalue:{value:{time:'+2010-01-01T00:00:00Z',precision:11}}}}]}});
globalThis.fetch=async(input,options)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 if(url.hostname==='query.wikidata.org')return Response.json({results:{bindings:[{film:{value:'http://www.wikidata.org/entity/Q25188'}}]}});
 if(url.origin!=='https://www.wikidata.org')return original(input,options);
 const query=url.searchParams.get('srsearch')||'';
 if(query.includes('Provider error'))return Response.json({}, {status:503});
 if(url.searchParams.get('list')==='search'){const id=url.searchParams.get('sroffset')==='12'?'Q25189':'Q25188';return Response.json({query:{searchinfo:{totalhits:query.includes('Empty')?0:24},search:query.includes('Empty')?[]:[{title:id}]}});}
 const ids=(url.searchParams.get('ids')||'').split('|');
 return Response.json({entities:Object.fromEntries(ids.map(id=>[id,url.searchParams.get('props')==='labels'?{id,labels:{en:{value:'Synthetic Wiki Director'}}}:film(id)]))});
};
