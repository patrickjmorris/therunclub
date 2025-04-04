import { CalculatorModeProvider } from "./components/calculator-mode-provider";

export default function CalculatorsPage() {
	return (
		<div className="container mx-auto py-8 space-y-8">
			<div className="prose dark:prose-invert max-w-none">
				<h1 className="text-4xl font-bold mb-4">Running Pace Calculator</h1>
				<p className="text-xl text-muted-foreground">
					Calculate your running pace, predict race times, and get training
					recommendations based on your current fitness level.
				</p>
			</div>

			<CalculatorModeProvider />

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
