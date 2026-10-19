'use client';
import Image from 'next/image';
export default function MovieArtwork({ src, title, backdrop = false }: { src: string | null; title: string; backdrop?: boolean }) {
  return <Image src={src || '/placeholder-movie.svg'} alt={backdrop ? '' : `Poster for ${title}`} fill sizes={backdrop ? '100vw' : '(max-width: 640px) 40vw, 280px'} className="object-cover" onError={event => { event.currentTarget.srcset = ''; event.currentTarget.src = '/placeholder-movie.svg'; }} />;
}
