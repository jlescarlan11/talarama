# TMDB attribution and release review

Checked 2026-10-19 against official primary sources: [FAQ](https://developer.themoviedb.org/docs/faq), [logo guidance](https://www.themoviedb.org/about/logos-attribution), [API terms](https://www.themoviedb.org/api-terms-of-use). Direct HTTP/search retrieval was restricted for some pages; a read-only browser reached the logo and terms pages. The retrieved terms report last updated October 20, 2023. Recheck the account's actual accepted terms before launch; this records evidence, not a legal clearance.

`/about` displays the FAQ's notice and the terms' application-specific notice, an unchanged approved Alt short blue SVG, a TMDB home link, and a separate upstream-rights statement. Footer credits are reachable throughout the app. The mark is subordinate to Talarama, on a dark surface so its original colors stay legible. No recoloring or distortion.

Asset source: [approved SVG](https://www.themoviedb.org/assets/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg), saved byte-for-byte as `public/tmdb-blue-short.svg`. This is a provider trademark, outside any eventual code license.

The FAQ permits attributed noncommercial use and directs commercial projects to TMDB licensing. The API terms restrict caching to six months and require removal on termination. Movie data/artwork carry separate rights. No API dataset is sublicensed by this repository.

## Blocking retention/terms gate

Short shared-result TTLs alone do not expire persistent Movie snapshots or historical exports. Current fallback snapshots intentionally survive failed refresh; there is no automatic retention worker. Before public use, the owner/operator must approve and demonstrate a retention process covering stored provider fields, Next caches, image caches and backups within the applicable limit, including removal/termination handling. Schedule refresh comfortably before expiry (proposed 150 days), monitor failures and arrange a reviewed metadata-only purge if refresh is impossible. Preserve local IDs, accounts and member-authored relationships/content; never delete a movie row to expire metadata. Restored backups must be reviewed for stale provider content before exposure.

No purge, conversion, provider agreement acceptance or production refresh occurred here. The executable operational mechanism and account-specific terms review remain open release gates; the local build must not be described as fully terms-compliant. Any monetization requires a fresh commercial-use review/agreement.
