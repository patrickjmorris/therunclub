import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) =>
	fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@": fromRoot("./src"),
			"server-only": fromRoot(
				"./node_modules/next/dist/compiled/server-only/empty.js",
			),
		},
	},
});
