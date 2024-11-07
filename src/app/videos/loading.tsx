export default function Loading() {
	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-6">Videos</h1>
			<div className="h-20 bg-muted rounded-lg animate-pulse mb-8" />
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						key={i}
						className="aspect-video bg-muted rounded-lg animate-pulse"
					/>
				))}
			</div>
		</div>
	);
}
