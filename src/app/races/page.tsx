import { Suspense } from "react";
import { Shell } from "@/components/shell";
import { RaceFinder } from "./race-finder";

export const metadata = {
	title: "Find Races | The Run Club",
	description: "Find running races near you",
};

export default function RacesPage() {
	return (
		<Shell>
			<div className="container py-8">
				<h1 className="text-3xl font-bold mb-8">Find Races</h1>
				<Suspense fallback={<div>Loading race finder...</div>}>
					<RaceFinder />
				</Suspense>
			</div>
		</Shell>
	);
}
