import {MOVIE_SYNC_TTL_MS} from './sync';
import type {DiscoveryProgress} from './local-discovery-cache';
type DiscoveryPage={page:number;hasMore?:boolean;totalPages:number;results:readonly unknown[];stale?:true};
type Progress={page:number;movies:number;hasMore:boolean;head:boolean};

/** One read per idle sweep. Uses the same verified discovery cache as browsing;
 * stores only a page frontier and scheduling state, never member data.
 */
export class DiscoveryPrefetch {
 private nextPage=1;
 private nextHeadRefresh=Infinity;
 private nextAttempt=0;
 private complete=false;
 private pending?:Promise<Progress|undefined>;
 private ready?:Promise<void>;
 constructor(private readonly load:(page:number)=>Promise<DiscoveryPage>,private readonly options:{now?:()=>number;checkpoint?:{readProgress:()=>Promise<DiscoveryProgress|undefined>;saveProgress:(progress:DiscoveryProgress)=>Promise<void>}}={}){
  this.ready=options.checkpoint?.readProgress().then(state=>{
   if(state&&Number.isInteger(state.nextPage)&&state.nextPage>=1&&state.nextPage<=500&&Number.isFinite(state.nextHeadRefresh)&&Number.isFinite(state.nextAttempt)){
    this.nextPage=state.nextPage;this.complete=state.complete;
    this.nextHeadRefresh=Math.min(state.nextHeadRefresh,this.now()+MOVIE_SYNC_TTL_MS);
    this.nextAttempt=Math.min(state.nextAttempt,this.now()+60000);
   }
  }).catch(()=>{});
 }
 private now(){return(this.options.now||Date.now)();}
 tick():Promise<Progress|undefined>{
  if(this.pending)return this.pending;
  let attempted=false;
  this.pending=Promise.resolve().then(async()=>{
   if(this.ready)await this.ready;
   const now=this.now();
   if(now<this.nextAttempt||(this.complete&&now<this.nextHeadRefresh))return;
   attempted=true;return this.advance();
  }).finally(async()=>{
   if(attempted){
    this.nextAttempt=this.now()+60000;
    if(Number.isFinite(this.nextHeadRefresh))await this.options.checkpoint?.saveProgress({nextPage:this.nextPage,nextHeadRefresh:this.nextHeadRefresh,nextAttempt:this.nextAttempt,complete:this.complete}).catch(()=>{});
   }
   this.pending=undefined;
  });
  return this.pending;
 }
 private async advance():Promise<Progress>{
  const head=this.nextPage!==1&&this.now()>=this.nextHeadRefresh;
  const target=head?1:this.nextPage;
  const data=await this.load(target);
  if(data.page!==target)throw Error('Unexpected discovery page');
  if(data.stale)throw Error('Cached discovery awaits source recovery');
  const hasMore=target<500&&(data.hasMore??data.totalPages>target);
  if(target===1)this.nextHeadRefresh=this.now()+MOVIE_SYNC_TTL_MS;
  if(!hasMore)this.complete=true;
  else if(head){
   if(this.complete){this.complete=false;this.nextPage=2;}
  }else{this.complete=false;this.nextPage=target+1;}
  return {page:target,movies:data.results.length,hasMore,head:target===1};
 }
}
