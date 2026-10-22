// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {DiscoveryPrefetch} from '@/app/lib/wikidata/discovery-prefetch';
import {WikidataSync} from '@/app/lib/wikidata/sync';

afterEach(()=>vi.useRealTimers());
const page=(page:number,hasMore=true)=>({page,hasMore,totalPages:hasMore?page+1:page,results:[]});

it('warms successive discovery pages on idle server sweeps with no browsing, then stops with the worker',async()=>{
 vi.useFakeTimers();
 const load=vi.fn(async(number:number)=>page(number));
 const prefetch=new DiscoveryPrefetch(load);
 const sync=new WikidataSync(async()=>{throw Error('No saved movie IDs in this fixture');});
 const stop=sync.start(async()=>{await prefetch.tick();return [];});
 await vi.advanceTimersByTimeAsync(180000);
 expect(load.mock.calls.map(([number])=>number)).toEqual([1,2,3]);
 stop();await vi.advanceTimersByTimeAsync(180000);expect(load).toHaveBeenCalledTimes(3);
});
it('coalesces in-flight discovery and retries the same page after failure with a minute between completed sweeps',async()=>{
 let now=0;let fail=false;let release!:()=>void;
 const load=vi.fn(async(number:number)=>{if(number===1)await new Promise<void>(resolve=>{release=resolve;});if(fail)throw Error('Source unavailable');return page(number);});
 const prefetch=new DiscoveryPrefetch(load,{now:()=>now});
 const first=prefetch.tick(),overlap=prefetch.tick();await Promise.resolve();expect(load).toHaveBeenCalledTimes(1);
 release();await Promise.all([first,overlap]);await prefetch.tick();expect(load).toHaveBeenCalledTimes(1);
 now=60000;fail=true;await expect(prefetch.tick()).rejects.toThrow('Source unavailable');
 await expect(prefetch.tick()).resolves.toBeUndefined();expect(load).toHaveBeenCalledTimes(2);
 now=120000;fail=false;await prefetch.tick();now=180000;await prefetch.tick();
 expect(load.mock.calls.map(([number])=>number)).toEqual([1,2,2,3]);
});
it('checks the head hourly without losing the advancing frontier and rescans after reaching the current end',async()=>{
 let now=0;let terminal=false;
 const load=vi.fn(async(number:number)=>page(number,number!==3||!terminal));
 const prefetch=new DiscoveryPrefetch(load,{now:()=>now});
 await prefetch.tick();now=60000;await prefetch.tick();
 now=3600000;await prefetch.tick();now+=60000;terminal=true;await prefetch.tick();
 expect(load.mock.calls.map(([number])=>number)).toEqual([1,2,1,3]);
 now+=60000;await prefetch.tick();expect(load).toHaveBeenCalledTimes(4);
 now=7200000;await prefetch.tick();now+=60000;await prefetch.tick();
 expect(load.mock.calls.map(([number])=>number)).toEqual([1,2,1,3,1,2]);
});
