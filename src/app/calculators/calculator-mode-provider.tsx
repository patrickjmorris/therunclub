"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaceCalculator from "@/components/calculator/pace-calculator";
import { useQueryState } from "nuqs";
import { QuickTips } from "./quick-tips";
import { AdvancedTips } from "./advanced-tips";

export function CalculatorModeProvider() {
	const [calculatorMode, setCalculatorMode] = useQueryState("mode", {
		defaultValue: "simple",
		parse: (value) => value as "simple" | "advanced",
		serialize: (value) => value,
	});

	return (
		<Tabs
			defaultValue={calculatorMode}
			value={calculatorMode}
			className="space-y-8"
			onValueChange={(value) => setCalculatorMode(value)}
		>
			<div className="flex justify-center sm:justify-start">
				<TabsList className="grid w-full sm:w-auto grid-cols-2">
					<TabsTrigger value="simple">Simple Calculator</TabsTrigger>
					<TabsTrigger value="advanced">Advanced Calculator</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="simple">
				<div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4 lg:gap-8">
					<PaceCalculator mode="simple" />
					<div className="hidden lg:block">
						<QuickTips />
					</div>
				</div>
			</TabsContent>

			<TabsContent value="advanced">
				<div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4 lg:gap-8">
					<PaceCalculator mode="advanced" />
					<div className="hidden lg:block">
						<AdvancedTips />
					</div>
				</div>
			</TabsContent>
		</Tabs>
	);
}

export default CalculatorModeProvider;
