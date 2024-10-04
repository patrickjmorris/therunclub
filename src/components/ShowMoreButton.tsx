import { useEffect, useRef, useState } from "react";

interface ShowMoreButtonProps {
	content: string;
	maxHeight: number;
}

function ShowMoreButton({ content, maxHeight }: ShowMoreButtonProps) {
	const [isOverflowing, setIsOverflowing] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const checkOverflow = () => {
			if (contentRef.current) {
				setIsOverflowing(contentRef.current.scrollHeight > maxHeight);
			}
		};

		checkOverflow();
		window.addEventListener("resize", checkOverflow);
		return () => window.removeEventListener("resize", checkOverflow);
	}, [content, maxHeight]);

	return (
		<div>
			<div
				ref={contentRef}
				className={`overflow-hidden transition-all duration-300 ease-in-out ${
					isExpanded ? "" : `max-h-[${maxHeight}px]`
				}`}
			>
				{content}
			</div>
			{isOverflowing && !isExpanded && (
				<button
					type="button"
					className="mt-2 inline-block text-sm font-bold leading-6 text-pink-500 hover:text-pink-700 active:text-pink-900"
					onClick={() => setIsExpanded(true)}
				>
					Show more
				</button>
			)}
		</div>
	);
}

export default ShowMoreButton;
