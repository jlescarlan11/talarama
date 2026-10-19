import 'server-only';
import {ZodError} from 'zod';
import {CommunityError} from '@/app/services/profileService';
import {RateLimitError} from '@/app/lib/rateLimit';
import {json} from '@/app/lib/movies/http';
export {json};
export function communityError(error:unknown){
 if(error instanceof RateLimitError)return Response.json({error:error.message,retryAfter:error.retryAfter},{status:429,headers:{'Cache-Control':'no-store','Retry-After':String(error.retryAfter)}});
 if(error instanceof CommunityError)return json({error:error.message},error.status);
 if(error instanceof ZodError || error instanceof SyntaxError)return json({error:'Check the submitted fields.'},400);
 return json({error:'Could not complete this request. Please try again.'},500);
}
