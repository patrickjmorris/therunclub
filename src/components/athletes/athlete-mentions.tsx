"use client";

import { type AthleteMention } from "@/lib/services/athlete-service";
import EpisodeEntry from "@/components/podcasts/EpisodeEntry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCardMention } from "@/components/videos/video-card-mention";
import { useState } from "react";
import type { BasicEpisode, BasicVideo } from "@/types/shared";

// Helper function to safely convert episode data to BasicEpisode
const toBasicEpisode = (episode: AthleteMention["episode"]): BasicEpisode => {
	if (!episode)
		return {
			id: "",
			title: "Missing episode",
			episodeSlug: "",
			podcastTitle: "",
			podcastSlug: "",
			pubDate: null,
			podcastImage: null,
			duration: "",
			content: null,
			podcastId: "",
			podcastAuthor: null,
			enclosureUrl: null,
			explicit: null,
			link: null,
		};

	// Handle explicit type which must be "yes", "no", or null
	let explicit: "yes" | "no" | null = null;
	if (episode.explicit === "yes") explicit = "yes";
	if (episode.explicit === "no") explicit = "no";

	return {
		id: episode.id,
		title: episode.title,
		episodeSlug: episode.episodeSlug,
		content: episode.content,
		pubDate: episode.pubDate,
		podcastImage: episode.podcastImage,
		episodeImage: episode.episodeImage,
		duration: episode.duration || "",
		podcastSlug: episode.podcastSlug || "",
		podcastTitle: episode.podcastTitle || "",
		podcastId: episode.podcastId || "",
		podcastAuthor: episode.podcastAuthor,
		enclosureUrl: episode.enclosureUrl,
		explicit,
		link: episode.link,
	};
};

// Helper function to safely convert video data to BasicVideo
const toBasicVideo = (video: AthleteMention["video"]): BasicVideo => {
	if (!video)
		return {
			id: "",
			title: "Missing video",
			youtubeVideoId: "",
			channelId: "",
			thumbnailUrl: null,
			channelTitle: null,
			publishedAt: null,
			description: null,
			viewCount: null,
			likeCount: null,
			commentCount: null,
			duration: null,
			createdAt: null,
			updatedAt: null,
			tags: [],
		};

	return {
		id: video.id,
		title: video.title,
		thumbnailUrl: video.thumbnailUrl,
		channelTitle: video.channelTitle,
		channelId: "", // Default value since it's required but missing
		publishedAt: video.publishedAt,
		description: video.description,
		viewCount: video.viewCount,
		likeCount: video.likeCount,
		commentCount: null, // Default value since it's required but missing
		duration: video.duration,
		youtubeVideoId: video.youtubeVideoId,
		createdAt: null,
		updatedAt: null,
		tags: [],
	};
};

interface AthleteMentionsProps {
	mentions: AthleteMention[];
	title?: string;
}

export function AthleteMentions({
	mentions,
	title = "Recent Mentions",
}: AthleteMentionsProps) {
	const [activeTab, setActiveTab] = useState<string>("all");

	if (mentions.length === 0) {
		return null;
	}

	// Group mentions by content type
	const podcastMentions = mentions.filter(
		(mention) => mention.contentType === "podcast" && mention.episode,
	);
	const videoMentions = mentions.filter(
		(mention) => mention.contentType === "video" && mention.video,
	);
	const hasPodcasts = podcastMentions.length > 0;
	const hasVideos = videoMentions.length > 0;

	// If we only have one type, just show that without tabs
	if (!hasPodcasts || !hasVideos) {
		return (
			<div className="space-y-6">
				<h3 className="text-lg font-semibold">{title}</h3>
				<div className="space-y-6">
					{hasPodcasts &&
						podcastMentions.map((mention) => (
							<div key={`podcast-${mention.id}`}>
								<EpisodeEntry episode={toBasicEpisode(mention.episode)} />
							</div>
						))}
					{hasVideos &&
						videoMentions.map((mention) => (
							<div key={`video-${mention.id}`}>
								<VideoCardMention video={toBasicVideo(mention.video)} />
							</div>
						))}
				</div>
			</div>
		);
	}

	// Both types are available, show tabs
	return (
		<div className="space-y-6">
			<h3 className="text-lg font-semibold">{title}</h3>
			<Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="w-full grid grid-cols-3">
					<TabsTrigger value="all">All</TabsTrigger>
					<TabsTrigger value="podcasts">Podcasts</TabsTrigger>
					<TabsTrigger value="videos">Videos</TabsTrigger>
				</TabsList>
				<TabsContent value="all" className="mt-6">
					<div className="space-y-6">
						{mentions.map((mention) => {
							if (mention.contentType === "podcast" && mention.episode) {
								return (
									<div key={`podcast-${mention.id}`}>
										<EpisodeEntry episode={toBasicEpisode(mention.episode)} />
									</div>
								);
							}
							if (mention.contentType === "video" && mention.video) {
								return (
									<div key={`video-${mention.id}`}>
										<VideoCardMention video={toBasicVideo(mention.video)} />
									</div>
								);
							}
							return null;
						})}
					</div>
				</TabsContent>
				<TabsContent value="podcasts" className="mt-6">
					<div className="space-y-6">
						{podcastMentions.map((mention) => (
							<div key={`podcast-${mention.id}`}>
								<EpisodeEntry episode={toBasicEpisode(mention.episode)} />
							</div>
						))}
					</div>
				</TabsContent>
				<TabsContent value="videos" className="mt-6">
					<div className="space-y-6">
						{videoMentions.map((mention) => (
							<div key={`video-${mention.id}`}>
								<VideoCardMention video={toBasicVideo(mention.video)} />
							</div>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
