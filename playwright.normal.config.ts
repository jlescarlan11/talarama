import {defineConfig} from '@playwright/test';
import wikidata from './playwright.wikidata.config';
const server=wikidata.webServer as {command:string;url:string;reuseExistingServer:boolean;timeout:number;env:Record<string,string>};
export default defineConfig({...wikidata,testMatch:'**/normal-discovery.spec.ts',webServer:{...server,env:{...server.env,TALARAMA_LOCAL_PREVIEW:'',TALARAMA_TEST_NO_POSTERS:'1'}}});
