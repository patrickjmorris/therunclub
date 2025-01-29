import { type PlayerAPI } from "@/components/AudioProvider";

function RewindIcon(props: React.ComponentPropsWithoutRef<"svg">) {
	return (
		// <svg
		//   aria-hidden="true"
		//   viewBox="0 0 24 24"
		//   fill="none"
		//   strokeWidth="1.5"
		//   strokeLinecap="round"
		//   strokeLinejoin="round"
		//   {...props}
		// >
		//   <path d="M8 5L5 8M5 8L8 11M5 8H13.5C16.5376 8 19 10.4624 19 13.5C19 15.4826 18.148 17.2202 17 18.188" />
		//   <path d="M5 15V19" />
		//   <path d="M8 18V16C8 15.4477 8.44772 15 9 15H10C10.5523 15 11 15.4477 11 16V18C11 18.5523 10.5523 19 10 19H9C8.44772 19 8 18.5523 8 18Z" />
		// </svg>
		<svg
			width="32"
			height="32"
			viewBox="0 0 32 32"
			fill="none"
			role="img"
			focusable="false"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>Back 15 seconds</title>
			<path
				d="M16 4c6.627 0 12 5.373 12 12s-5.373 12-12 12S4 22.627 4 16a11.97 11.97 0 0 1 4-8.944"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path
				d="m11 4 5 3V1l-5 3ZM12.621 11.406h.69l-1.125-.535.435.535Zm-2.386 2.831 2.822-2.297-.87-1.069-2.822 2.297.87 1.07Zm1.697-2.831v9.188h1.379v-9.188h-1.379ZM16.604 11.724v-.69h-.505l-.152.482.657.208Zm-1.29 4.077-.658-.208 1.078.754-.42-.546Zm5.808 1.678-.69-.01.69.01Zm-.403-6.444h-4.115v1.378h4.115v-1.378Zm-4.772.481-1.29 4.077 1.313.416 1.291-4.077-1.314-.416Zm-.213 4.83c.709-.545 1.405-1.028 2.484-1.028v-1.379c-1.568 0-2.582.743-3.325 1.316l.84 1.092Zm2.484-1.028c1.444 0 2.231 1.007 2.215 2.151l1.378.02c.027-1.86-1.327-3.55-3.593-3.55v1.379Zm2.215 2.151a2.228 2.228 0 0 1-.54 1.413c-.346.391-.896.705-1.756.705v1.378c1.238 0 2.17-.47 2.789-1.17a3.606 3.606 0 0 0 .885-2.306l-1.378-.02Zm-2.296 2.118c-1.686 0-2.135-1.15-2.135-1.549h-1.378c0 1.095 1.003 2.927 3.513 2.927v-1.378Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function RewindButton({
	player,
	amount = 15,
}: {
	player: PlayerAPI;
	amount?: number;
}) {
	return (
		<button
			type="button"
			className="group relative flex h-10 w-10 items-center justify-center rounded-full focus:outline-none"
			onClick={() => player.seekBy(-amount)}
			aria-label={`Rewind ${amount} seconds`}
		>
			<div className="absolute -inset-4 -right-2 md:hidden" />
			<RewindIcon className="h-6 w-6 text-foreground group-hover:text-foreground/90" />
		</button>
	);
}
