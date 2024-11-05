export function AdvancedTips() {
	return (
		<div className="space-y-6">
			<div className="rounded-lg border p-4">
				<h3 className="font-semibold">Training Zones</h3>
				<ul className="mt-2 space-y-2 text-sm">
					<li>Easy: 65-75% of max effort</li>
					<li>Tempo: 76-85% of max effort</li>
					<li>Threshold: 86-92% of max effort</li>
					<li>VO2 Max: 93-100% of max effort</li>
				</ul>
			</div>

			<div className="rounded-lg border p-4">
				<h3 className="font-semibold">Advanced Features</h3>
				<ul className="mt-2 space-y-1 text-sm">
					<li>Detailed splits for every mile/km</li>
					<li>Track workout lap calculator</li>
					<li>Training zone recommendations</li>
					<li>Race prediction times</li>
				</ul>
			</div>
		</div>
	);
}
