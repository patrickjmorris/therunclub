import { NextRequest, NextResponse } from 'next/server';
import { webSubManager } from '@/lib/websub-manager';

export async function GET(request: NextRequest) {
    // Handle subscription verification
    const searchParams = request.nextUrl.searchParams;
    const { statusCode, body } = await webSubManager.handleVerification(searchParams);
    
    return new NextResponse(body, { status: statusCode });
}

export async function POST(request: NextRequest) {
    // Handle content notifications
    const topic = request.headers.get('x-hub-topic');
    const signature = request.headers.get('x-hub-signature');
    
    if (!topic) {
        return new NextResponse('Missing topic header', { status: 400 });
    }

    try {
        const body = await request.text();
        const { statusCode, body: responseBody } = await webSubManager.handleNotification(
            topic,
            signature,
            body
        );

        return new NextResponse(responseBody, { status: statusCode });
    } catch (error) {
        console.error('Error processing WebSub notification:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
