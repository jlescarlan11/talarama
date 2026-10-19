import { usernameSchema } from './contracts';
/** A proposal only. Operator reviews every changed handle before applying a manifest. */
export function previewUsernames(rows: {id:string;username:string|null}[]) {
 const sorted=[...rows].sort((a,b)=>a.id.localeCompare(b.id));
 const used=new Set(rows.filter(row=>row.username && usernameSchema.safeParse(row.username).success && row.username===row.username.trim().toLowerCase()).map(row=>row.username!));
 return sorted.map(row=>{
  const parsed=usernameSchema.safeParse(row.username);
  if(parsed.success && row.username===parsed.data) return {id:row.id,original:row.username,proposed:row.username,changed:false};
  const base=parsed.success?parsed.data:'member';
  let proposed=base; let suffix=0;
  while(used.has(proposed)) { suffix++; const ending=`_${suffix}`; proposed=base.slice(0,20-ending.length)+ending; }
  used.add(proposed);
  return {id:row.id,original:row.username,proposed,changed:row.username!==proposed};
 });
}
