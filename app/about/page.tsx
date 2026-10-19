import Image from 'next/image';

export const metadata = {
  title: 'About & credits | Talarama',
  description: 'A movie diary with deliberate publication, community reviews and movie discovery. Credits and data attribution.',
};

export default function About() {
  return <article className="max-w-[48rem] mx-auto space-y-8 py-6">
    <header className="space-y-4">
      <h1 className="text-3xl font-bold">About Talarama</h1>
      <p>Discover a film, keep a viewing diary and choose what to share. Your diary is private by default. Publishing a profile and an entry is always your choice.</p>
    </header>
    <section className="space-y-4" aria-labelledby="movie-data-credits">
      <h2 id="movie-data-credits" className="text-2xl font-bold">Movie data & credits</h2>
      <p>Movie discovery uses <a className="link" href="https://www.wikidata.org">Wikidata</a>. Its structured movie metadata is released under CC0. Wikidata does not provide TMDB popularity rankings or scores.</p>
      <p>Images have separate rights. Available posters use identity-linked Wikimedia Commons files marked public domain or CC0, with source details on each film. Other entries use the local artwork fallback; a metadata license does not automatically license linked images.</p>
      <p>Existing TMDB-linked movies and their saved data remain supported by the legacy integration, credited below.</p>
      <a href="https://www.themoviedb.org" className="inline-block rounded-lg bg-[#0d253f] p-4" aria-label="TMDB">
        <Image src="/tmdb-blue-short.svg" width={84} height={11} alt="TMDB" unoptimized />
      </a>
      <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      <p>This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.</p>
      <p>Movie artwork and data remain subject to their respective rights and provider terms. A source-code license does not license movie images, provider data, trademarks or member contributions.</p>
      <p>TMDB scores use a ten-point scale. Talarama ratings use a separate five-point scale, with one newest eligible rating per member and movie.</p>
    </section>
    <section className="space-y-3">
      <h2 className="text-2xl font-bold">Project credits</h2>
      <p>Originally built by Bisuela, Caringal, Dela Cruz, and Escarlan as a CMSC 127 project.</p>
    </section>
  </article>;
}
