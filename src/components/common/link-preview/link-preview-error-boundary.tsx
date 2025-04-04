"use client";

import * as React from "react";

interface Props {
	children: React.ReactNode;
	fallback: React.ReactNode;
}

interface State {
	hasError: boolean;
}

export class LinkPreviewErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(_: Error): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error) {
		console.error("Error loading link previews:", error);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="text-sm text-muted-foreground">
					Unable to load link previews. You can still click the links in the
					description.
				</div>
			);
		}

		return this.props.children;
	}
}
