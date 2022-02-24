import { NextResponse } from "next/server";

export default function middleware(req) {
  const url = req.nextUrl.clone(); // clone the request url
  const { pathname } = req.nextUrl; // get pathname of request (e.g. /blog-slug)
  const hostname = req.headers.get("host"); // get hostname of request (e.g. demo.therunclub.xyz)

  const currentHost =
    process.env.NODE_ENV === "production" && process.env.VERCEL === "1"
      ? hostname
        .replace(`.therunclub.xyz`, "")
        .replace(`.therunclub.vercel.app`, "")
      : hostname.replace(`.localhost:3000`, "");

  if (pathname.startsWith(`/_sites`)) {
    return new Response(null, { status: 404 });
  }

  if (!pathname.includes(".") && !pathname.startsWith("/api")) {
    if (currentHost == "app") {
      if (
        pathname === "/login" &&
        (req.cookies["next-auth.session-token"] ||
          req.cookies["__Secure-next-auth.session-token"])
      ) {
        return NextResponse.redirect("/");
      }
      url.pathname = `/app${pathname}`;
      return NextResponse.rewrite(url);
    } else if (
      hostname === "localhost:3000" || 
      hostname === "therunclub.vercel.app" || 
      hostname === "therunclub.xyz" &&
      pathname !== "/"
      ) {
        return;
    } else if (
      hostname === "localhost:3000" || 
      hostname === "therunclub.vercel.app" || 
      hostname === "therunclub.xyz"
      ) {
        url.pathname = `/`;
        return NextResponse.rewrite(url);
      } else {
        url.pathname = `/_sites/${currentHost}${pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }