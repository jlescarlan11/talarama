import { libraryHandler, type MovieContext } from '@/app/lib/movies/library-handler';
export async function GET(_request: Request, context: MovieContext) { return libraryHandler(context, 'favorite'); }
export async function POST(_request: Request, context: MovieContext) { return libraryHandler(context, 'favorite', true); }
export async function DELETE(_request: Request, context: MovieContext) { return libraryHandler(context, 'favorite', false); }
