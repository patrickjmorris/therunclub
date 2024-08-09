import Link from "next/link";

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to the Running Website</h1>
      <p>Explore the latest running news, tips, and events.</p>
      <Link href="/podcasts">Podcasts</Link>
    </div>
  );
};

export default HomePage