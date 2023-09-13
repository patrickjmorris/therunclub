import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import React from "react";
import { signOut } from "next-auth/react";
import Loader from "./Loader";
import useRequireAuth from "../../lib/useRequireAuth";

export default function Layout({ siteId, children }) {
  const title = "The Run Club";
  const description =
    "Building and supporting the running community";
  const logo = "/favicon.png";
  const router = useRouter();
  const sitePage = router.pathname.startsWith("/app/site/[id]");
  const postPage = router.pathname.startsWith("/app/post/[id]");
  const rootPage = !sitePage && !postPage;
  const tab = rootPage
    ? router.asPath.split("/")[1]
    : router.asPath.split("/")[3];

  const session = useRequireAuth();
  if (!session) return <Loader />;

  return <>
    <div>
      <Head>
        <title>{title}</title>
        {/* <link rel="icon" href={logo} /> */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏃</text></svg>" />
        <link rel="shortcut icon" type="image/x-icon" href={logo} />
        <link rel="apple-touch-icon" sizes="180x180" href={logo} />
        <meta name="theme-color" content="#7b46f6" />

        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta itemProp="name" content={title} />
        <meta itemProp="description" content={description} />
        <meta itemProp="image" content={logo} />
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={logo} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@therunclub_xyz" />
        <meta name="twitter:creator" content="@patrickjmorris" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={logo} />
      </Head>
      <div className="absolute left-0 right-0 h-16 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-full max-w-screen-xl px-10 mx-auto sm:px-20">
          <div className="flex space-x-4">
            <Link href="/" className="flex items-center justify-center">

              <div className="inline-block w-8 h-8 overflow-hidden align-middle rounded-full">
                <Image
                  src={session.user.image}
                  width={40}
                  height={40}
                  alt={session.user.name}
                />
              </div>
              <span className="inline-block ml-3 font-medium truncate sm:block">
                {session.user.name}
              </span>

            </Link>
            <div className="h-8 border border-gray-300" />
            <button
              className="text-gray-500 transition-all duration-150 ease-in-out hover:text-gray-700"
              onClick={() => signOut()}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {rootPage && (
        <div className="absolute left-0 right-0 flex items-center justify-center space-x-16 bg-white border-b border-gray-200 top-16 font-cal">
          <Link
            href="/"
            className={`border-b-2 ${
              tab == "" ? "border-black" : "border-transparent"
            } py-3`}>
            
              My Sites
            
          </Link>
          <Link
            href="/settings"
            className={`border-b-2 ${
              tab == "settings" ? "border-black" : "border-transparent"
            } py-3`}>
            
              Settings
            
          </Link>
        </div>
      )}
      {sitePage && (
        <div className="absolute left-0 right-0 bg-white border-b border-gray-200 top-16 font-cal">
          <div className="flex items-center justify-between max-w-screen-xl px-10 mx-auto space-x-16 sm:px-20">
            <Link href={`/`}>
              ←<p className="hidden ml-3 md:inline-block">All Sites</p>

            </Link>
            <div className="flex items-center justify-between space-x-10 md:space-x-16">
              <Link
                href={`/site/${router.query.id}`}
                className={`border-b-2 ${
                  !tab ? "border-black" : "border-transparent"
                } py-3`}>
                
                  Posts
                
              </Link>
              <Link
                href={`/site/${router.query.id}/drafts`}
                className={`border-b-2 ${
                  tab == "drafts" ? "border-black" : "border-transparent"
                } py-3`}>
                
                  Drafts
                
              </Link>
              <Link
                href={`/site/${router.query.id}/settings`}
                className={`border-b-2 ${
                  tab == "settings" ? "border-black" : "border-transparent"
                } py-3`}>
                
                  Settings
                
              </Link>
            </div>
            <div />
          </div>
        </div>
      )}
      {postPage && (
        <div className="absolute left-0 right-0 bg-white border-b border-gray-200 top-16 font-cal">
          <div className="flex items-center justify-between max-w-screen-xl px-10 mx-auto space-x-16 sm:px-20">
            {siteId ? (
              (<Link href={`/site/${siteId}`}>
                ←<p className="hidden ml-3 md:inline-block">All Posts</p>

              </Link>)
            ) : (
              <div>
                {" "}
                ←<p className="hidden ml-3 md:inline-block">All Posts</p>
              </div>
            )}

            <div className="flex items-center justify-between space-x-10 md:space-x-16">
              <Link
                href={`/post/${router.query.id}`}
                className={`border-b-2 ${
                  !tab ? "border-black" : "border-transparent"
                } py-3`}>
                
                  Editor
                
              </Link>
              <Link
                href={`/post/${router.query.id}/settings`}
                className={`border-b-2 ${
                  tab == "settings" ? "border-black" : "border-transparent"
                } py-3`}>
                
                  Settings
                
              </Link>
            </div>
            <div />
          </div>
        </div>
      )}
      <div className="pt-28">{children}</div>
    </div>
  </>;
}
