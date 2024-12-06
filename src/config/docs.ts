import { MainNavItem, SidebarNavItem } from "@/types/nav";

export interface DocsConfig {
	mainNav: MainNavItem[];
}

export const docsConfig: DocsConfig = {
	mainNav: [
		{
			title: "Find A Race",
			href: "/races",
		},
		{
			title: "Podcasts",
			href: "/podcasts",
		},
		{
			title: "Run Clubs",
			href: "/clubs",
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
	],
};
