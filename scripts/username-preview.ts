import {readFile} from 'node:fs/promises';
import {PrismaClient} from '@prisma/client';
import {previewUsernames} from '../app/lib/profiles/usernames';
import {applyReviewedUsernames,usernameManifest} from '../app/services/usernameMigrationService';
import {guardCatalogDatabase,reserveOutput} from './catalog-runner.mjs';
async function main(){
 guardCatalogDatabase();
 const [mode,path,auditPath,...extra]=process.argv.slice(2);
 if(extra.length||!path||!['preview','--reviewed'].includes(mode)||(mode==='preview'&&auditPath)||(mode==='--reviewed'&&!auditPath))throw Error('Invalid arguments');
 const db=new PrismaClient();
 try{
  const output=await reserveOutput(mode==='preview'?path:auditPath!);
  try{
   if(mode==='preview'){
    const rows=await db.user.findMany({select:{id:true,username:true},orderBy:{id:'asc'},take:1001});
    if(rows.length>1000)throw Error('Requires reviewed batched export');
    await output.writeFile(JSON.stringify({version:1,generatedAt:new Date().toISOString(),rows:previewUsernames(rows)},null,2));await output.sync();
    console.log(`Preview exported: ${rows.length} members; no writes.`);
   }else{
    const text=await readFile(path,'utf8');if(text.length>1000000)throw Error('Manifest too large');
    const manifest=usernameManifest.parse(JSON.parse(text));
    await output.writeFile(JSON.stringify({state:'PREPARED',manifest})+'\n');await output.sync();
    const audit=await applyReviewedUsernames(manifest,{db});
    await output.writeFile(JSON.stringify({state:'COMMITTED',audit})+'\n');await output.sync();
    console.log(`Reviewed username mappings committed: ${manifest.mappings.length}.`);
   }
  }finally{await output.close();}
 }finally{await db.$disconnect();}
}
main().catch(()=>{console.error('Username operation refused. Inspect local guard, reviewed manifest and audit/DB for uncertain commit before retrying.');process.exitCode=1;});
