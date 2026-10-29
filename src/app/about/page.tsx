import { ComingSoon } from "@/components/common/coming-soon";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
	...pageMetadata({
		title: "About The Run Club",
		description:
			"The Run Club collects running podcasts, videos, athletes, races, and clubs in one place.",
		path: "/about",
	}),
	robots: { index: false, follow: true },
};

function AboutPage() {
	return <ComingSoon />;
}

export default AboutPage;
