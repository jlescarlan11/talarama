import 'server-only';
import {z} from 'zod';
import {MetadataCache} from '@/app/lib/tmdb/cache';
import type {PosterCredit} from '@/app/lib/tmdb/types';

type Film={wikidataId:string;title:string};
export function localWikipediaPostersEnabled(env:Record<string,string|undefined>=process.env){
  try{const url=new URL(env.NEXTAUTH_URL||'');return env.TALARAMA_WIKIPEDIA_POSTERS==='1' && env.TALARAMA_LOCAL_PREVIEW==='wikidata' && url.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname);}catch{return false;}
}
const title=z.string().min(1).max(240).regex(/^[^|\[\]{}<>\x00-\x1f\x7f]+$/);
const filename=z.string().min(1).max(240).regex(/^[^|\[\]{}<>\x00-\x1f\x7f/\\]+\.(jpe?g|png|webp)$/i);
const normalize=(value:string)=>value.replaceAll('_',' ').normalize('NFC');
const plain=(value:string)=>value.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,1000);
const pageSchema=z.object({title:z.string(),pageprops:z.object({wikibase_item:z.string().regex(/^Q[1-9]\d{0,11}$/)}),pageimage:filename,thumbnail:z.object({source:z.string().max(2048),width:z.number().positive().max(480),height:z.number().positive().max(1000)})});
const fileSchema=z.object({title:z.string(),imagerepository:z.literal('local'),imageinfo:z.array(z.object({mime:z.enum(['image/jpeg','image/png','image/webp']),extmetadata:z.record(z.object({value:z.union([z.string().max(12000),z.number()])}).passthrough())})).length(1)});

/** Read-only low-resolution English Wikipedia images, used only by the loopback preview. */
export class WikipediaPosters {
  private cache=new MetadataCache();
  private blockedUntil=0;
  constructor(private readonly options:{fetcher?:typeof fetch}={}){}
  async resolve(input:Film[],{throwOnError=false}:{throwOnError?:boolean}={}):Promise<Map<string,PosterCredit>> {
    const films=input.filter(film=>/^Q[1-9]\d{0,11}$/.test(film.wikidataId)&&title.safeParse(film.title).success).slice(0,12);
    if(!films.length)return new Map();
    try{return await this.cache.get(JSON.stringify(films),3600000,async()=>{
      const raw=await this.api({titles:[...new Set(films.map(film=>film.title))].join('|'),prop:'pageimages|pageprops',piprop:'thumbnail|name',pithumbsize:'320',pilicense:'any',ppprop:'wikibase_item'});
      const pages=raw.map(page=>pageSchema.safeParse(page)).filter(page=>page.success).map(page=>page.data!);
      const matched=pages.flatMap(page=>{
        const film=films.find(film=>film.wikidataId===page.pageprops.wikibase_item&&normalize(film.title)===normalize(page.title));
        if(!film || !/\bposter\b/i.test(normalize(page.pageimage)) || page.thumbnail.height/page.thumbnail.width<1.1 || page.thumbnail.height/page.thumbnail.width>2.3)return [];
        try{const url=new URL(page.thumbnail.source);if(url.protocol!=='https:' || !['upload.wikimedia.org','thumb.wikimedia.org'].includes(url.hostname) || url.port || url.username || url.password || url.hash || !url.pathname.startsWith('/wikipedia/en/'))return [];
          const parts=url.pathname.split('/'),file=url.pathname.startsWith('/wikipedia/en/thumb/')?parts.at(-2):parts.at(-1);
          if(!file || normalize(decodeURIComponent(file))!==normalize(page.pageimage))return [];
          url.search='';return [{film,file:page.pageimage,url:url.href}];
        }catch{return [];}
      });
      if(!matched.length)return new Map();
      const files=await this.api({titles:[...new Set(matched.map(row=>`File:${row.file}`))].join('|'),prop:'imageinfo',iiprop:'extmetadata|mime',iiextmetadatalanguage:'en'});
      const result=new Map<string,PosterCredit>();
      for(const row of matched){
        const parsed=fileSchema.safeParse(files.find(file=>file&&typeof file==='object'&&'title'in file&&normalize(String(file.title))===normalize(`File:${row.file}`)));
        if(!parsed.success)continue;const meta=parsed.data.imageinfo[0].extmetadata;const value=(key:string)=>String(meta[key]?.value??'');
        if(value('NonFree').toLowerCase()!=='true' || !/fair use/i.test(value('LicenseShortName')) || value('DeletionReason') || value('Restrictions'))continue;
        const sourceUrl=`https://en.wikipedia.org/wiki/File:${encodeURIComponent(row.file.replaceAll(' ','_'))}`;
        result.set(row.film.wikidataId,{url:row.url,sourceUrl,license:'Copyrighted (Wikipedia)',licenseUrl:sourceUrl+'#Licensing',artist:plain(value('Artist'))||'See source for copyright holder',credit:plain(value('Credit')),previewOnly:true});
      }
      return result;
    });}catch(error){if(throwOnError)throw error;return new Map();}
  }
  private async api(params:Record<string,string>):Promise<unknown[]> {
    if(Date.now()<this.blockedUntil)throw Error('Wikipedia cooldown');
    const url=new URL('https://en.wikipedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',...params}).toString();
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    try{return await Promise.race([new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Wikipedia timeout'));},8000);}), (async()=>{
      const response=await(this.options.fetcher||fetch)(url,{headers:{'User-Agent':'TalaramaLocal/0.1 (https://github.com/jlescarlan11/talarama)','Accept':'application/json'},redirect:'error',cache:'no-store',signal:controller.signal});
      if(response.status===429){const seconds=Number(response.headers.get('retry-after'));this.blockedUntil=Date.now()+Math.max(60,Math.min(3600,Number.isFinite(seconds)?seconds:60))*1000;throw Error('Wikipedia rate limit');}
      if(!response.ok || response.redirected || Number(response.headers.get('content-length'))>2*1024*1024)throw Error('Invalid Wikipedia response');
      const reader=response.body?.getReader();if(!reader)throw Error('Missing body');const chunks:Uint8Array[]=[];let size=0;
      try{for(;;){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2*1024*1024)throw Error('Wikipedia body too large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      return z.object({query:z.object({pages:z.array(z.unknown()).max(50)})}).parse(JSON.parse(new TextDecoder().decode(bytes))).query.pages;
    })()]);}finally{clearTimeout(timer!);}
  }
}
