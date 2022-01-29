import Head from "next/head";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex h-screen bg-black">
      <Head>
        <title>The Run Club</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="w-48 m-auto">
        <Image
          width={512}
          height={512}
          src="/logo.png"
          alt="The Run Club"
        />
      </div>
    </div>
  );
}
