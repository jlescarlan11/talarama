import {render} from '@testing-library/react';
import type {ReactNode} from 'react';
import {expect,it,vi} from 'vitest';
import type {DiaryEntryWithMovie} from '@/app/diaries/types/diary';
const images=vi.hoisted(()=>[] as {src:string;unoptimized?:boolean;referrerPolicy?:string}[]);
vi.mock('next/image',()=>({default:(props:{src:string;unoptimized?:boolean;referrerPolicy?:string})=>{images.push(props);return null;}}));
vi.mock('@/app/diaries/DiaryDialog',()=>({default:({children}:{children:ReactNode})=><div>{children}</div>}));
vi.mock('@/app/diaries/DiaryEntryMenu',()=>({default:()=>null}));
import DiaryEntryCard from '@/app/diaries/DiaryEntryCard';
import DiaryEntryViewModal from '@/app/diaries/DiaryEntryViewModal';
import MoviePreview from '@/app/diaries/_components/MoviePreview';
const entry={id:'unchanged-entry',rating:4,review:'Keep review',watchedDate:new Date('2020-02-29'),visibility:'PRIVATE',movie:{id:'unchanged-movie',title:'Saved film',posterUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Poster.jpg/500px-Poster.jpg',releasedYear:1957,duration:90}} as DiaryEntryWithMovie;
it('renders imported Commons posters in diary cards, details and log previews without the image proxy',()=>{
 render(<DiaryEntryCard diaryEntry={entry}/>);render(<DiaryEntryViewModal entry={entry} onClose={()=>{}}/>);render(<MoviePreview selectedMovie={entry.movie}/>);
 expect(images).toHaveLength(3);
 for(const image of images){expect(image.src).toBe(entry.movie.posterUrl);expect(image.unoptimized).toBe(true);expect(image.referrerPolicy).toBe('no-referrer');}
});
