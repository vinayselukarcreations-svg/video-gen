import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt, videoUrl } = await request.json();

    if (!prompt || !videoUrl) {
      return NextResponse.json(
        { error: 'Prompt and videoUrl are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'XAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.x.ai/v1/videos/edits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-imagine-video',
        prompt: prompt,
        video_url: videoUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('xAI API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Failed to edit video' },
        { status: response.status }
      );
    }

    if (data.id) {
      return NextResponse.json({ request_id: data.id }, { status: 202 });
    }

    return NextResponse.json(
      { error: 'No request ID returned from API' },
      { status: 500 }
    );
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');

    if (!requestId) {
      return NextResponse.json(
        { error: 'request_id is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'XAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    if (response.status === 202) {
      return NextResponse.json({ status: 'processing' }, { status: 202 });
    }

    if (!response.ok) {
      console.error('xAI API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Failed to get video result' },
        { status: response.status }
      );
    }

    if (data.video && data.video.url) {
      return NextResponse.json({
        url: data.video.url,
        duration: data.video.duration,
        status: 'completed',
      });
    }

    return NextResponse.json(
      { error: 'No video URL returned from API' },
      { status: 500 }
    );
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
