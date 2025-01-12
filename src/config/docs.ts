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
			href: "/clubs",
		},
		{
			title: "Videos",
			href: "/videos",
		},
		{
			title: "Athletes",
			href: "/athletes",
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
