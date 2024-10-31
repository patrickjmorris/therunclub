"use client";

import PaceCalculator from "@/components/calculator/pace-calculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { useQueryState } from "nuqs";

export default function CalculatorsPage() {
	const [calculatorMode, setCalculatorMode] = useQueryState("mode", {
		defaultValue: "simple",
		parse: (value) => value as "simple" | "advanced",
		serialize: (value) => value,
	});

	return (
		<div className="container mx-auto py-8 space-y-8">
			<div className="prose dark:prose-invert max-w-none">
				<h1 className="text-4xl font-bold mb-4">Running Pace Calculator</h1>
				<p className="text-xl text-muted-foreground">
					Calculate your running pace, predict race times, and get training
					recommendations based on your current fitness level.
				</p>
			</div>

			<Tabs
				defaultValue={calculatorMode}
				value={calculatorMode}
				className="space-y-8"
				onValueChange={(value) => setCalculatorMode(value)}
			>
				<TabsList>
					<TabsTrigger value="simple">Simple Calculator</TabsTrigger>
					<TabsTrigger value="advanced">Advanced Calculator</TabsTrigger>
				</TabsList>

				<TabsContent value="simple" className="space-y-8">
					<div className="grid md:grid-cols-[1fr,300px] gap-8">
						<PaceCalculator mode="simple" />

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
					</div>
				</TabsContent>

				<TabsContent value="advanced" className="space-y-8">
					<div className="grid md:grid-cols-[1fr,300px] gap-8">
						<PaceCalculator mode="advanced" />

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
					</div>
				</TabsContent>
			</Tabs>

			<div className="prose dark:prose-invert max-w-none">
				<h2>How to Use the Pace Calculator</h2>
				<p>
					Whether you're training for your first 5K or preparing for a marathon,
					understanding your pace is crucial for successful training and racing.
					Here's how to use the calculator effectively:
				</p>

				<h3>For New Runners</h3>
				<p>
					Start with the Simple Calculator. Enter your recent run distance and
					time to understand your current pace. This helps you:
				</p>
				<ul>
					<li>Track your progress over time</li>
					<li>Set realistic race goals</li>
					<li>Maintain consistent training paces</li>
				</ul>

				<h3>For Experienced Runners</h3>
				<p>Use the Advanced Calculator to access:</p>
				<ul>
					<li>Training zone calculations based on your race times</li>
					<li>Detailed split predictions for races</li>
					<li>Track workout planning tools</li>
					<li>Race time predictions across different distances</li>
				</ul>
			</div>
		</div>
	);
}
