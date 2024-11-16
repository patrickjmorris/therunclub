interface ColorPaletteDisplayProps {
	title: string;
	colors: string[];
}

export function ColorPaletteDisplay({
	title,
	colors,
}: ColorPaletteDisplayProps) {
	if (!colors?.length) return null;

	return (
		<div className="space-y-2">
			<h3 className="text-sm font-medium text-muted-foreground uppercase">
				{title}
			</h3>
			<div className="flex gap-2">
				{colors.map((color, index) => (
					<div
						key={`${color}-${
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							index
						}`}
						className="space-y-1"
					>
						<div
							className="w-12 h-12 rounded-md shadow-sm"
							style={{ backgroundColor: color }}
							title={color}
						/>
						<p className="text-xs text-muted-foreground break-all">{color}</p>
					</div>
				))}
			</div>
		</div>
	);
}
