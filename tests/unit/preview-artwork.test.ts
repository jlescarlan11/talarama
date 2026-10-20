// @vitest-environment node
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {movieMetadata} from '@/app/services/movieImportService';
import type {WikidataMovie} from '@/app/lib/tmdb/types';
it('keeps copyrighted Wikipedia preview artwork out of imported movie snapshots',()=>{
 const url='https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg';
 const movie:WikidataMovie={localId:null,wikidataId:'Q109228991',tmdbId:null,title:'Dune: Part Two',description:null,releasedYear:2024,duration:166,posterUrl:url,backdropUrl:null,tmdbScore:null,tmdbVoteCount:null,genres:[],cast:[],directors:[],posterCredit:{url,sourceUrl:'https://en.wikipedia.org/wiki/File:Dune_Part_Two_poster.jpeg',license:'Copyrighted (Wikipedia)',licenseUrl:'https://en.wikipedia.org/wiki/File:Dune_Part_Two_poster.jpeg#Licensing',artist:'Studio',credit:'',previewOnly:true}};
 for(const input of [movie,{...movie,posterCredit:undefined}]){const snapshot=movieMetadata(input);expect(snapshot.posterUrl).toBeNull();expect(snapshot.credits).toEqual({cast:[],directors:[]});}
});
