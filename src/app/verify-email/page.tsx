import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnvelopeOpenIcon } from "@radix-ui/react-icons";

export default function VerifyEmailPage() {
	return (
		<div className="flex h-screen w-full items-center justify-center px-4">
			<Card className="mx-auto max-w-md">
				<CardHeader>
					<div className="flex items-center justify-center">
						<EnvelopeOpenIcon className="h-12 w-12 text-primary" />
					</div>
					<CardTitle className="text-center text-2xl">
						Check your email
					</CardTitle>
				</CardHeader>
				<CardContent className="text-center">
					<p className="text-muted-foreground">
						We&apos;ve sent you a verification link to your email address.
						Please click the link to verify your account.
					</p>
					<div className="mt-4 space-y-2 text-sm text-muted-foreground">
						<p>Didn&apos;t receive an email?</p>
						<p>- Check your spam folder</p>
						<p>- Make sure you entered the correct email address</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
