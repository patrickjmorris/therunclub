type JsonLdData = Record<string, unknown> | Record<string, unknown>[];

// Escape "<" so text fields (episode/video descriptions) cannot close the
// script tag.
export function JsonLd({ data }: { data: JsonLdData }) {
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: serialized JSON with "<" escaped
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, "\\u003c"),
			}}
		/>
	);
}
