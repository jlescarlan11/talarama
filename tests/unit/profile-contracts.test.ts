import { expect, it } from 'vitest';
import { profileSchema, usernameSchema } from '@/app/lib/profiles/contracts';
import { previewUsernames } from '@/app/lib/profiles/usernames';
const profile = {username:'member_one',name:'Member',bio:'',timeZone:'Asia/Manila',profilePublished:false,showFavorites:false};
it('normalizes chosen handles, rejects reserved/invalid handles and identity or role injection',()=>{
 expect(usernameSchema.parse(' Member_ONE ')).toBe('member_one');
 for(const value of ['ab','admin','API','me','settings','support','a-b','a'.repeat(21)]) expect(usernameSchema.safeParse(value).success).toBe(false);
 expect(profileSchema.safeParse(profile).success).toBe(true);
 for(const field of ['id','email','role','userId','image']) expect(profileSchema.safeParse({...profile,[field]:'injected'}).success).toBe(false);
 expect(profileSchema.safeParse({...profile,bio:'a'.repeat(301)}).success).toBe(false);
 expect(profileSchema.safeParse({...profile,timeZone:'Invalid/Zone'}).success).toBe(false);
});
it('previews deterministic legacy collisions without overwriting populated handles',()=>{
 const rows=[{id:'b',username:'Alice'},{id:'a',username:'alice'},{id:'c',username:null},{id:'d',username:'admin'}];
 const preview=previewUsernames(rows);
 expect(preview).toEqual(previewUsernames([...rows].reverse()));
 expect(preview.find(x=>x.id==='a')).toMatchObject({original:'alice',proposed:'alice'});
 expect(new Set(preview.map(x=>x.proposed)).size).toBe(4);
 for(const row of preview) expect(usernameSchema.safeParse(row.proposed).success).toBe(true);
 expect(rows[0].username).toBe('Alice');
});
