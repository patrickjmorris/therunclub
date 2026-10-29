import { ComingSoon } from "@/components/common/coming-soon";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
	...pageMetadata({
		title: "Running Training Plans",
		description: "Running training plans from The Run Club are coming soon.",
		path: "/training-plans",
	}),
	robots: { index: false, follow: true },
};

export default function TrainingPlansPage() {
	return <ComingSoon />;
}
