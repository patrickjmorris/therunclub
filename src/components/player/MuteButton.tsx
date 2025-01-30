import { type PlayerAPI } from "@/components/AudioProvider";
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";

function MuteIcon({
	muted,
	...props
}: React.ComponentPropsWithoutRef<"svg"> & {
	muted: boolean;
}) {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			{muted ? (
				<>
					<path d="M12 6L8 10H6C5.44772 10 5 10.4477 5 11V13C5 13.5523 5.44772 14 6 14H8L12 18V6Z" />
					<path d="M16 10L19 13" fill="none" />
					<path d="M19 10L16 13" fill="none" />
				</>
			) : (
				<>
					<path d="M12 6L8 10H6C5.44772 10 5 10.4477 5 11V13C5 13.5523 5.44772 14 6 14H8L12 18V6Z" />
					<path d="M17 7C17 7 19 9 19 12C19 15 17 17 17 17" fill="none" />
					<path
						d="M15.5 10.5C15.5 10.5 16 10.9998 16 11.9999C16 13 15.5 13.5 15.5 13.5"
						fill="none"
					/>
				</>
			)}
		</svg>
	);
}

interface MuteButtonProps {
	player: PlayerAPI;
	size?: "base" | "lg";
	asChild?: boolean;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const MuteButton = forwardRef<HTMLButtonElement, MuteButtonProps>(
	({ player, size = "base", onClick, asChild = false }, ref) => {
		const Comp = asChild ? Slot : "span";

		return (
			<Comp ref={ref}>
				<MuteIcon
					muted={player.muted}
					className="h-6 w-6 text-foreground group-hover:text-foreground/90"
				/>
			</Comp>
		);
	},
);
