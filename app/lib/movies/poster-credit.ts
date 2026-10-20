import {z} from 'zod';
// Commons already supplies a bounded thumbnail; use it directly without another image proxy.
export function isCommonsPosterUrl(src:string|null|undefined){
 return !!src && /^https:\/\/(?:thumb|upload)\.wikimedia\.org\/wikipedia\/commons\/[^?#]+$/.test(src);
}
export function isWikipediaPreviewPosterUrl(src:string|null|undefined){
 return !!src && /^https:\/\/(?:thumb|upload)\.wikimedia\.org\/wikipedia\/en\/[^?#]+$/.test(src);
}
export function isWikimediaPosterUrl(src:string|null|undefined){return isCommonsPosterUrl(src)||isWikipediaPreviewPosterUrl(src);}
export const posterCreditSchema=z.object({
 url:z.string().refine(isCommonsPosterUrl),
 sourceUrl:z.string().regex(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:[^?#]+$/),
 license:z.enum(['Public domain','CC0']),
 licenseUrl:z.enum(['https://commons.wikimedia.org/wiki/Help:Public_domain','https://creativecommons.org/publicdomain/zero/1.0/']),
 artist:z.string().max(1000),credit:z.string().max(1000),
});
