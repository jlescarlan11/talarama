import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import base from './playwright.config';
const server=base.webServer as {command:string;url:string;reuseExistingServer:boolean;timeout:number;env:Record<string,string>};
export default defineConfig({...base,testMatch:'**/wikidata.spec.ts',testIgnore:[],webServer:{...server,env:{...server.env,CATALOG_PROVIDER:'wikidata',NODE_OPTIONS:`--require="${resolve('tests/e2e/wikidata-fixture.cjs').replaceAll('\\','/')}"`}}});
