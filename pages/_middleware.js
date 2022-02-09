import { NextResponse } from "next/server";

export default function middleware(req) {
  const { pathname } = req.nextUrl; // get pathname of request (e.g. /blog-slug)
  const hostname = req.headers.get("host"); // get hostname of request (e.g. demo.therunclub.xyz)

  // only for demo purposes – remove this if you want to use your root domain as the landing page
  if (hostname === "therunclub.xyz" || hostname === "platforms.vercel.app") {
    return NextResponse.redirect("https://demo.therunclub.xyz");
  }

  const currentHost =
    process.env.NODE_ENV === "production" && process.env.VERCEL === "1"
      ? hostname.replace(`.therunclub.xyz`, "")
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
      return NextResponse.rewrite(`/app${pathname}`);
    }  else if (hostname === "localhost:3000" && pathname !== "/") {
      return;
    }  else if (hostname === "localhost:3000") {
      return NextResponse.rewrite(`/home/`);
    } else {
      return NextResponse.rewrite(`/_sites/${currentHost}${pathname}`);
    }
  }
}
