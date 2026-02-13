import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt, image } = await request.json();

    if (!prompt || !image) {
      return NextResponse.json(
        { error: 'Prompt and image are required' },
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

    const response = await fetch('https://api.x.ai/v1/images/edits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-imagine-image',
        prompt: prompt,
        image: {
          url: image,
          type: 'image_url',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('xAI API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Failed to edit image' },
        { status: response.status }
      );
    }

    if (data.data && data.data[0] && data.data[0].url) {
      return NextResponse.json({ url: data.data[0].url });
    }

    return NextResponse.json(
      { error: 'No edited image returned from API' },
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
