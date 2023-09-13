import Link from "next/link";

export default function Nav() {
  return (
    <nav className="p-4 lg:p-8">
      <Link href="/" className="font-bold">
        The Run Club
      </Link>
    </nav>
  );
}