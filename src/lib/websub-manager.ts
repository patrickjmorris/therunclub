import { db } from "@/db/client";
import { podcasts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updatePodcastByFeedUrl } from "./podcast-service";

const SUBSCRIPTION_VERIFY_TIMEOUT = 60000; // 1 minute timeout for subscription verification

interface WebSubSubscription {
    topic: string;      // The feed URL
    hub: string;        // The hub URL
    leaseSeconds: number; // How long the subscription is valid for
    secret: string;     // Secret for verifying hub notifications
}

class WebSubManager {
    private subscriptions: Map<string, WebSubSubscription> = new Map();
    private callbackUrl: string;

    constructor(baseUrl: string) {
        this.callbackUrl = `${baseUrl}/api/websub/callback`;
    }

    async subscribe(feedUrl: string, hubUrl: string): Promise<boolean> {
        try {
            const formData = new URLSearchParams();
            formData.append('hub.mode', 'subscribe');
            formData.append('hub.topic', feedUrl);
            formData.append('hub.callback', this.callbackUrl);
            formData.append('hub.secret', this.generateSecret());
            formData.append('hub.lease_seconds', '86400'); // 24 hours

            const response = await fetch(hubUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (response.ok) {
                this.subscriptions.set(feedUrl, {
                    topic: feedUrl,
                    hub: hubUrl,
                    leaseSeconds: 86400,
                    secret: formData.get('hub.secret') as string,
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error subscribing to WebSub hub:', error);
            return false;
        }
    }

    async handleVerification(query: URLSearchParams): Promise<{ statusCode: number; body: string }> {
        const mode = query.get('hub.mode');
        const topic = query.get('hub.topic');
        const challenge = query.get('hub.challenge');
        const leaseSeconds = query.get('hub.lease_seconds');

        if (!topic || !challenge) {
            return { statusCode: 400, body: 'Missing required parameters' };
        }

        if (mode === 'subscribe' || mode === 'unsubscribe') {
            // Verify this is a topic we're interested in
            const podcast = await db.query.podcasts.findFirst({
                where: eq(podcasts.feedUrl, topic),
            });

            if (!podcast) {
                return { statusCode: 404, body: 'Topic not found' };
            }

            if (mode === 'subscribe' && leaseSeconds) {
                // Update subscription info
                const subscription = this.subscriptions.get(topic);
                if (subscription) {
                    subscription.leaseSeconds = parseInt(leaseSeconds, 10);
                }
            } else if (mode === 'unsubscribe') {
                this.subscriptions.delete(topic);
            }

            return { statusCode: 200, body: challenge };
        }

        return { statusCode: 400, body: 'Invalid mode' };
    }

    async handleNotification(
        topic: string, 
        signature: string | null, 
        body: string
    ): Promise<{ statusCode: number; body: string }> {
        const subscription = this.subscriptions.get(topic);
        
        if (!subscription) {
            return { statusCode: 404, body: 'Subscription not found' };
        }

        if (signature) {
            const isValid = this.verifySignature(body, signature, subscription.secret);
            if (!isValid) {
                return { statusCode: 403, body: 'Invalid signature' };
            }
        }

        try {
            // Update the podcast content
            await updatePodcastByFeedUrl(topic);
            return { statusCode: 200, body: 'Update processed successfully' };
        } catch (error) {
            console.error('Error processing WebSub notification:', error);
            return { statusCode: 500, body: 'Error processing update' };
        }
    }

    private generateSecret(): string {
        return crypto.randomUUID();
    }

    private verifySignature(body: string, signature: string, secret: string): boolean {
        const hmac = crypto.createHmac('sha1', secret);
        hmac.update(body);
        const expectedSignature = `sha1=${hmac.digest('hex')}`;
        return signature === expectedSignature;
    }
}

// Create a singleton instance
const webSubManager = new WebSubManager(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');

export { webSubManager, WebSubManager };
