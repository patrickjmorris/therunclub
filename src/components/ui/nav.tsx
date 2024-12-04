"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navItems = [
	{ name: "Home", href: "/" },
	{ name: "Podcasts", href: "/podcasts" },
	{ name: "Clubs", href: "/coming-soon" },
	{ name: "Video", href: "/coming-soon" },
	{ name: "Runners", href: "/coming-soon" },
	{ name: "Training", href: "/coming-soon" },
];

export default function Navigation() {
	const [isSticky, setIsSticky] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsSticky(window.scrollY > 0);
		};

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				isSticky ? "bg-white shadow-md" : "bg-transparent"
			}`}
		>
			<div className="container mx-auto px-4">
				<div className="flex items-center justify-between py-4">
					<Link href="/" className="text-2xl font-bold text-primary">
						The Run Club
					</Link>
					<nav className="hidden md:block">
						<ul className="flex space-x-6">
							{navItems.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</nav>
					{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
					<button
						className="md:hidden"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						aria-label="Toggle mobile menu"
					>
						{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>
			</div>
			{isMobileMenuOpen && (
				<nav className="md:hidden bg-white">
					<ul className="py-4">
						{navItems.map((item) => (
							<li key={item.name} className="px-4 py-2">
								<Link
									href={item.href}
									className="block text-sm font-medium text-gray-700 hover:text-primary transition-colors"
									onClick={() => setIsMobileMenuOpen(false)}
								>
									{item.name}
								</Link>
							</li>
						))}
					</ul>
				</nav>
			)}
		</header>
	);
}
