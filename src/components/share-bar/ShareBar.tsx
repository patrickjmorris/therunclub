"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
// import { useToast } from "@/components/ui/use-toast"; // Commented out until module resolved
import {
	Share2,
	Link as LinkIcon,
	Check,
	Twitter,
	Facebook,
	Linkedin,
} from "lucide-react"; // Assuming lucide-react is used

interface ShareBarProps {
	url: string;
	title: string;
	hashtags?: string[]; // Optional hashtags for Twitter
}

export function ShareBar({ url, title, hashtags = [] }: ShareBarProps) {
	// const { toast } = useToast(); // Commented out
	const [copied, setCopied] = useState(false);
	const [showNativeShare, setShowNativeShare] = useState(false);

	// Check for navigator.share availability on mount using useEffect
	useEffect(() => {
		if (typeof navigator !== "undefined" && navigator.share) {
			setShowNativeShare(true);
		}
	}, []); // Empty dependency array runs only once on mount

	const encodedUrl = encodeURIComponent(url);
	const encodedTitle = encodeURIComponent(title);
	const twitterHashtags = hashtags.join(",");

	const handleNativeShare = async () => {
		try {
			await navigator.share({
				title: title,
				url: url,
			});
			console.log("Content shared successfully");
		} catch (error) {
			console.error("Error sharing:", error);
			// toast({ // Commented out
			// 	title: "Sharing failed",
			// 	description: "Could not share using the native share dialog.",
			// 	variant: "destructive",
			// });
		}
	};

	const handleCopyLink = () => {
		navigator.clipboard.writeText(url).then(
			() => {
				setCopied(true);
				// toast({ // Commented out
				// 	title: "Link Copied!",
				// 	description: "The URL has been copied to your clipboard.",
				// });
				setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
			},
			(err) => {
				console.error("Failed to copy text: ", err);
				// toast({ // Commented out
				// 	title: "Copy failed",
				// 	description: "Could not copy the link to your clipboard.",
				// 	variant: "destructive",
				// });
			},
		);
	};

	// Construct share URLs
	const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${
		twitterHashtags ? `&hashtags=${twitterHashtags}` : ""
	}`;
	const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
	const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

	return (
		<div className="flex flex-wrap items-center gap-2 mt-4 border-t pt-4">
			<span className="text-sm font-medium mr-2 text-muted-foreground">
				Share:
			</span>
			{showNativeShare && (
				<Button variant="outline" size="icon" onClick={handleNativeShare}>
					<Share2 className="h-4 w-4" />
					<span className="sr-only">Share via device</span>
				</Button>
			)}
			<Button
				variant="outline"
				size="icon"
				onClick={() => window.open(twitterUrl, "_blank", "noopener,noreferrer")}
			>
				<Twitter className="h-4 w-4" />
				<span className="sr-only">Share on Twitter</span>
			</Button>
			<Button
				variant="outline"
				size="icon"
				onClick={() =>
					window.open(facebookUrl, "_blank", "noopener,noreferrer")
				}
			>
				<Facebook className="h-4 w-4" />
				<span className="sr-only">Share on Facebook</span>
			</Button>
			<Button
				variant="outline"
				size="icon"
				onClick={() =>
					window.open(linkedinUrl, "_blank", "noopener,noreferrer")
				}
			>
				<Linkedin className="h-4 w-4" />
				<span className="sr-only">Share on LinkedIn</span>
			</Button>
			<Button variant="outline" size="icon" onClick={handleCopyLink}>
				{copied ? (
					<Check className="h-4 w-4 text-green-500" />
				) : (
					<LinkIcon className="h-4 w-4" />
				)}
				<span className="sr-only">Copy Link</span>
			</Button>
		</div>
	);
}
