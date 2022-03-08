import "@/styles/globals.css";
import PlausibleProvider from "next-plausible";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <PlausibleProvider domain="therunclub.xyz">
        <Component {...pageProps} />
    </PlausibleProvider>
  );
}
