import { fireEvent,render,screen,waitFor } from '@testing-library/react';
import { it,expect,vi } from 'vitest';
import DiaryForm from '@/app/diaries/_components/DiaryForm';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),refresh:vi.fn(),back:vi.fn()})}));
it('defaults to private and unrated, retains draft and request ID on a failed response',async()=>{
 const bodies:Record<string,unknown>[]=[];
 vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{
  if(url.includes('timezone'))return Response.json({timeZone:'UTC'});
  bodies.push(JSON.parse(options.body as string));return Response.json({error:'Retry please'},{status:500});
 }));
 const movie={id:'m',title:'A movie',description:null,releasedYear:null,duration:null,posterUrl:null,directorFirstName:null,directorLastName:null,createdAt:new Date()};
 render(<DiaryForm movies={[movie]} initialMovie={movie}/>);
 expect(screen.getByLabelText('Visibility')).toHaveValue('PRIVATE');
 expect(screen.getByRole('button',{name:'No rating'})).toHaveAttribute('aria-pressed','true');
 fireEvent.change(screen.getByLabelText('Watched Date'),{target:{value:'2020-02-29'}});
 fireEvent.change(screen.getByLabelText('Review (optional)'),{target:{value:'Keep my draft'}});
 fireEvent.click(screen.getByLabelText('Rewatch'));
 fireEvent.click(screen.getByRole('button',{name:'Save Entry'}));
 await screen.findByRole('alert');
 expect(screen.getByLabelText('Review (optional)')).toHaveValue('Keep my draft');
 fireEvent.click(screen.getByRole('button',{name:'Save Entry'}));
 await waitFor(()=>expect(bodies).toHaveLength(2));
 expect(bodies[0]).toMatchObject({rating:null,review:'Keep my draft',isRewatch:true,visibility:'PRIVATE'});
 expect(bodies[0].clientRequestId).toBe(bodies[1].clientRequestId);
});
