import { MainNavItem, SidebarNavItem } from "@/types/nav";

export interface DocsConfig {
	mainNav: MainNavItem[];
}

export const docsConfig: DocsConfig = {
	mainNav: [
		{
			title: "Podcasts",
			href: "/podcasts",
		},
		{
			title: "Run Clubs",
			href: "/run-clubs",
		},
		{
			title: "Videos",
			href: "/videos",
		},
		{
			title: "Runners",
			href: "/runners",
		},
		{
			title: "Training Plans",
			href: "/training-plans",
		},
		{
			title: "Calculators",
			href: "/calculators",
		},
		{
			title: "Resources",
			href: "/resources",
		},
	],
};
