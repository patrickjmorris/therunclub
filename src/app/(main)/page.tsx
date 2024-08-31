import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import getPodcastandLastEpisodes from "@/lib/episodes"
import { slugify } from "@/lib/utils"
import { Headphones, Video, PersonStanding, Dumbbell, Users } from "lucide-react"
import Link from "next/link"

type Podcast = {
  title: string;
  slug: string;
  description: string;
  image: string;
  episodes: {
    title: string;
    pubDate: Date;
  };
};

export default async function HomePage() {
  const allPodcasts = await getPodcastandLastEpisodes();
  allPodcasts.sort((a, b) => new Date(b.episodes.pubDate).getTime() - new Date(a.episodes.pubDate).getTime());
  const podcasts = allPodcasts.slice(0, 3)
  
  console.log('Podcasts:', podcasts)
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
              Welcome to the Run Club
            </h1>
            <p className="mx-auto max-w-[700px] text-zinc-200 md:text-xl">
              Discover amazing podcasts and stay tuned for exciting new features coming soon!
            </p>
            <Button className="bg-white text-primary hover:bg-zinc-200">
              <Link href="/podcasts">Explore Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Podcasts Row */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">Featured Podcasts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast: Podcast, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{podcast.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <img src={podcast.image} alt={podcast.title} className="w-48 h-48 object-cover mb-4 rounded-md mx-auto" />
                  <p className="text-muted-foreground">{podcast.episodes.title}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {podcast.episodes.pubDate.toLocaleDateString()}
                  </p>
                  <Button className="mt-4" variant="outline">
                    <Headphones className="mr-2 h-4 w-4" />
                    <Link href={`/podcasts/${podcast.slug}/${slugify(podcast.episodes.title)}`}>Listen Now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          </div>
        
      </section>

      {/* Coming Soon Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">Coming Soon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Video", icon: Video },
              { name: "Runners", icon: PersonStanding },
              { name: "Training", icon: Dumbbell },
              { name: "Clubs", icon: Users },
            ].map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <item.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">Exciting features on the way!</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}