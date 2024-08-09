import { Episode, FEEDS } from "@/lib/episodes"
import { Container } from "../Container"
import { slugify } from "@/lib/utils"
import Link from "next/link"
import { FormattedDate } from "../FormattedDate"
import { EpisodePlayButton } from "../EpisodePlayButton"


function PauseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
      <svg aria-hidden="true" viewBox="0 0 10 10" {...props}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.496 0a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5H2.68a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5H1.496Zm5.82 0a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5H8.5a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5H7.316Z"
        />
      </svg>
    )
  }
  
  function PlayIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
      <svg aria-hidden="true" viewBox="0 0 10 10" {...props}>
        <path d="M8.25 4.567a.5.5 0 0 1 0 .866l-7.5 4.33A.5.5 0 0 1 0 9.33V.67A.5.5 0 0 1 .75.237l7.5 4.33Z" />
      </svg>
    )
  }

export default function EpisodeEntry({ episode, params }: { episode: Episode, params: any }) {
    let date = new Date(episode.pubDate)

    let feed = FEEDS.find((feed) => feed.slug === params.podcast)
    if (!feed) {
      // Handle the case where feed is undefined
      return null; // Or any other appropriate action
    }
  
    return (
      <article
        aria-labelledby={`episode-${episode.title}-title`}
        className="py-10 sm:py-12"
      >
        <Container>
          <div className="flex flex-col items-start">
            <h2
              id={`episode-${episode.title}-title`}
              className="mt-2 text-lg font-bold text-slate-900"
            >
              <Link href={`/podcasts/${feed.slug}/${slugify(episode.title)}`}>{episode.title}</Link>
            </h2>
            <FormattedDate
              date={date}
              className="order-first font-mono text-sm leading-7 text-slate-500"
            />
            <div className="mt-1 text-base leading-7 text-slate-700 line-clamp-4 prose prose-slate"
            dangerouslySetInnerHTML={{
                    __html: episode.description
                  }}>
              
            </div>
            <div className="flex items-center gap-4 mt-4">
              <EpisodePlayButton
                episode={episode}
                className="flex items-center text-sm font-bold leading-6 text-pink-500 gap-x-3 hover:text-pink-700 active:text-pink-900"
                playing={
                  <>
                    <PauseIcon className="h-2.5 w-2.5 fill-current" />
                    <span aria-hidden="true">Listen</span>
                  </>
                }
                paused={
                  <>
                    <PlayIcon className="h-2.5 w-2.5 fill-current" />
                    <span aria-hidden="true">Listen</span>
                  </>
                }
              />
              <span
                aria-hidden="true"
                className="text-sm font-bold text-slate-400"
              >
                /
              </span>
              <Link
                href={`/podcasts/${feed.slug}/${slugify(episode.title)}`}
                className="flex items-center text-sm font-bold leading-6 text-pink-500 hover:text-pink-700 active:text-pink-900"
                aria-label={`Show notes for episode ${episode.title}`}
              >
                Show notes
              </Link>
            </div>
          </div>
        </Container>
      </article>
    )
  }