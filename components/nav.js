import Link from "next/link";

export default function Nav() {
  return (
    <nav className="p-4 lg:p-8">
      <Link href="/">
        <a className="font-bold">The Run Club</a>
      </Link>
    </nav>
  );
}