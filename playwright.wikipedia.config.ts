import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
import base from './playwright.wikidata.config';
const server=base.webServer as {command:string;url:string;reuseExistingServer:boolean;timeout:number;env:Record<string,string>};
export default defineConfig({...base,testMatch:'**/wikipedia-posters.spec.ts',webServer:{...server,env:{...server.env,TALARAMA_LOCAL_PREVIEW:'',TALARAMA_WIKIPEDIA_POSTERS:'1',NODE_OPTIONS:`--require="${resolve('tests/e2e/wikipedia-fixture.cjs').replaceAll('\\','/')}"`}}});
