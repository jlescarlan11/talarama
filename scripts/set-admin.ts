import {PrismaClient} from '@prisma/client';
import {guardCatalogDatabase} from './catalog-runner.mjs';
async function main(){
 guardCatalogDatabase();
 const [userId,flag,...extra]=process.argv.slice(2);
 if(!userId||flag!=='--grant-admin'||extra.length)throw Error('Use explicit user ID and --grant-admin');
 const db=new PrismaClient();
 try{
  await db.$transaction(async tx=>{
   await tx.user.update({where:{id:userId},data:{role:'ADMIN'}});
   await tx.moderationAudit.create({data:{adminId:'operator-cli',entryId:'',reportId:'',action:`grant-admin:${userId}`}});
  });
  console.log('Administrator granted to the specified persisted member.');
 }finally{await db.$disconnect();}
}
main().catch(()=>{console.error('Admin bootstrap refused. Requires guarded loopback DB, exact existing user ID and --grant-admin.');process.exitCode=1;});
