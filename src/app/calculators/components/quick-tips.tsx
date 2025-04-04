import { Info } from "lucide-react";

export function QuickTips() {
	return (
		<div className="space-y-6">
			<div className="rounded-lg border p-4">
				<h3 className="font-semibold flex items-center gap-2">
					<Info className="w-4 h-4" />
					Quick Tips
				</h3>
				<ul className="mt-2 space-y-2 text-sm">
					<li>Enter your distance and time to calculate your pace</li>
					<li>Use this to track your progress over time</li>
					<li>Great for planning your first 5K or 10K race</li>
				</ul>
			</div>

			<div className="rounded-lg border p-4">
				<h3 className="font-semibold">Common Race Distances</h3>
				<ul className="mt-2 space-y-1 text-sm">
					<li>5K = 3.1 miles</li>
					<li>10K = 6.2 miles</li>
					<li>Half Marathon = 13.1 miles</li>
					<li>Marathon = 26.2 miles</li>
				</ul>
			</div>
		</div>
	);
}
