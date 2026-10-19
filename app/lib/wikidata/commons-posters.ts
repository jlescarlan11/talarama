import 'server-only';
import {z} from 'zod';
import {MetadataCache} from '@/app/lib/tmdb/cache';
import type {PosterCredit} from '@/app/lib/tmdb/types';

export type PosterCandidate = {file:string; explicitPoster:boolean};
const filename=z.string().min(1).max(240).regex(/^[^|\[\]{}<>\x00-\x1f\x7f/\\]+\.(jpe?g|png|webp|tiff?)$/i);
const metadata=z.record(z.object({value:z.union([z.string().max(12000),z.number()])}).passthrough());
const pageSchema=z.object({title:z.string(),imagerepository:z.literal('local'),imageinfo:z.array(z.object({width:z.number().positive(),height:z.number().positive(),mime:z.enum(['image/jpeg','image/png','image/webp']),thumburl:z.string(),descriptionurl:z.string(),extmetadata:metadata})).min(1).max(1)});
const normalizedFile=(file:string)=>file.replace(/^File:/,'').replaceAll('_',' ').normalize('NFC');
function plainText(value:string){return value.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim().slice(0,1000);}
function safeUrl(raw:string,media:boolean):string|null {
  try{const url=new URL(raw);if(url.protocol!=='https:' || url.username || url.password || url.port || url.hash)return null;
    if(media ? !['upload.wikimedia.org','thumb.wikimedia.org'].includes(url.hostname) || !url.pathname.startsWith('/wikipedia/commons/') : url.hostname!=='commons.wikimedia.org' || !url.pathname.startsWith('/wiki/File:'))return null;
    url.search='';return url.href;
  }catch{return null;}
}
function sameFile(url:string,file:string,source=false):boolean {
  try{
    const path=new URL(url).pathname,parts=path.split('/');
    const name=source?path.slice('/wiki/File:'.length):path.startsWith('/wikipedia/commons/thumb/')?parts.at(-2):parts.at(-1);
    return !!name && normalizedFile(decodeURIComponent(name))===normalizedFile(file);
  }catch{return false;}
}

/** Identity-linked Commons files only; no title guessing, Wikipedia fair-use files or member state. */
export class CommonsPosters {
  private cache=new MetadataCache();
  private blockedUntil=0;
  private fetcher:typeof fetch;
  constructor({fetcher=fetch}:{fetcher?:typeof fetch}={}){this.fetcher=fetcher;}

  async resolve(candidates:PosterCandidate[]):Promise<Map<string,PosterCredit>> {
    const valid=candidates.filter(item=>filename.safeParse(item.file).success).slice(0,48);
    if(!valid.length)return new Map();
    const files=[...new Set(valid.map(item=>item.file))].sort();
    try{
      const pages=await this.cache.get(JSON.stringify(files),86400000,()=>this.load(files));
      const result=new Map<string,PosterCredit>();
      for(const candidate of valid){
        const raw=pages.find(page=>page && typeof page==='object' && 'title' in page && normalizedFile(String(page.title))===normalizedFile(candidate.file));
        const parsed=pageSchema.safeParse(raw);if(!parsed.success)continue;
        const info=parsed.data.imageinfo[0],meta=info.extmetadata;
        const value=(key:string)=>String(meta[key]?.value??'');
        const license=value('License').toLowerCase(),name=value('LicenseShortName').toLowerCase();
        const publicDomain=license==='pd' && name==='public domain';
        const cc0=license==='cc-zero' && /^cc0(?:\s|$)/.test(name);
        if((!publicDomain && !cc0) || value('AttributionRequired').toLowerCase()!=='false' || value('NonFree').toLowerCase()==='true' || value('Copyrighted').toLowerCase()==='true' || value('DeletionReason') || value('Restrictions'))continue;
        // P18 can be a cast photograph or still. Require independent poster evidence.
        if(!candidate.explicitPoster && !/\bposter(s)?\b/i.test(`${candidate.file} ${value('Categories')}`))continue;
        const ratio=info.height/info.width;if(ratio<1.1 || ratio>2.3)continue;
        const url=safeUrl(info.thumburl,true),sourceUrl=safeUrl(info.descriptionurl,false);if(!url || !sourceUrl || !sameFile(url,candidate.file) || !sameFile(sourceUrl,candidate.file,true))continue;
        result.set(candidate.file,{url,sourceUrl,license:cc0?'CC0':'Public domain',licenseUrl:cc0?'https://creativecommons.org/publicdomain/zero/1.0/':'https://commons.wikimedia.org/wiki/Help:Public_domain',artist:plainText(value('Artist'))||'Artist not identified',credit:plainText(value('Credit'))});
      }
      return result;
    }catch{return new Map();} // An artwork outage must not hide the film or its member actions.
  }

  private async load(files:string[]):Promise<unknown[]> {
    if(Date.now()<this.blockedUntil)throw Error('Commons cooldown');
    const url=new URL('https://commons.wikimedia.org/w/api.php');
    url.search=new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'imageinfo',titles:files.map(file=>`File:${file}`).join('|'),iiprop:'url|size|mime|extmetadata',iiurlwidth:'480',iiextmetadatalanguage:'en'}).toString();
    const abort=new AbortController();let timer:ReturnType<typeof setTimeout>;
    try{return await Promise.race([new Promise<never>((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(Error('Commons timeout'));},8000);}), (async()=>{
      const response=await this.fetcher(url,{headers:{'User-Agent':'TalaramaLocal/0.1 (https://github.com/jlescarlan11/talarama)','Accept':'application/json'},redirect:'error',cache:'no-store',signal:abort.signal});
      if(response.status===429){const seconds=Number(response.headers.get('retry-after'));this.blockedUntil=Date.now()+Math.max(60,Math.min(3600,Number.isFinite(seconds)?seconds:60))*1000;throw Error('Commons rate limit');}
      if(!response.ok || response.redirected || Number(response.headers.get('content-length'))>2*1024*1024)throw Error('Invalid Commons response');
      const reader=response.body?.getReader();if(!reader)throw Error('Missing Commons body');
      const chunks:Uint8Array[]=[];let size=0;
      try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2*1024*1024)throw Error('Commons response too large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      const data=z.object({query:z.object({pages:z.array(z.unknown()).max(50)})}).parse(JSON.parse(new TextDecoder().decode(bytes)));
      return data.query.pages;
    })()]);}finally{clearTimeout(timer!);}
  }
}
