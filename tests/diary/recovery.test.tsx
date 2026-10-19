import {act,renderHook,waitFor} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import {useDiaryForm} from '@/app/diaries/_hooks/useDiaryForm';
const router=vi.hoisted(()=>({push:vi.fn(),refresh:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>router}));
const input={movieId:'m',watchedDate:'2020-02-29',rating:null,review:'First submitted text',isRewatch:false,containsSpoilers:false,visibility:'PRIVATE' as const,clientRequestId:'6dc7005d-aae6-41d6-8c47-dc128acb7ae3'};
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});
it('retries timezone initialization without dropping the mounted draft or blocking later save',async()=>{
 let zones=0;const creates:unknown[]=[];
 vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{
  if(url.includes('timezone')){zones++;if(zones===1)throw Error('Temporary network failure');return Response.json({timeZone:'UTC'});}
  creates.push(JSON.parse(options.body as string));return Response.json({id:'saved',...input});
 }));
 const {result}=renderHook(()=>{const hook=useDiaryForm({movies:[]});void hook.form.formState.errors;return hook;});
 await waitFor(()=>expect(zones).toBe(1));
 await act(()=>result.current.handleSubmit(input));
 expect(zones).toBe(2);expect(creates).toHaveLength(1);expect(router.push).toHaveBeenCalledWith('/diaries');
});
it('recovers an uncertain create before allowing changed fields to update that same viewing',async()=>{
 const creates:Record<string,unknown>[]=[];const patches:Record<string,unknown>[]=[];let stored:Record<string,unknown>|undefined;
 vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{
  if(url.includes('timezone'))return Response.json({timeZone:'UTC'});
  const body=JSON.parse(options.body as string);
  if(options.method==='PATCH'){patches.push(body);stored={id:'recovered',...body};return Response.json(stored);}
  creates.push(body);if(!stored){stored={id:'recovered',...body};throw Error('Committed response lost');}return Response.json(stored);
 }));
 const {result}=renderHook(()=>{const hook=useDiaryForm({movies:[]});void hook.form.formState.errors;return hook;});
 await act(()=>result.current.handleSubmit(input));
 expect(router.push).not.toHaveBeenCalled();
 const latest={...input,review:'Keep my later edits',rating:5};
 await act(()=>result.current.handleSubmit(latest));
 expect(router.push).not.toHaveBeenCalled();
 expect(creates).toHaveLength(2);expect(creates[1]).toEqual(creates[0]);
 expect(result.current.form.formState.errors.root?.message).toMatch(/latest changes/i);
 await act(()=>result.current.handleSubmit(latest));
 expect(patches).toHaveLength(1);expect(stored).toMatchObject({id:'recovered',review:'Keep my later edits',rating:5});
 expect(router.push).toHaveBeenCalledWith('/diaries');
});
