# AI Image Editor

A modern, minimal web app built with Next.js that allows users to upload images and edit them using AI-powered image editing via the xAI API.

## Features

- 🖼️ Drag and drop image upload
- 👁️ Real-time image preview
- 🎨 AI-powered image editing
- ⚡ Fast base64 conversion
- 📱 Fully responsive design
- 🎯 Clean, minimal UI
- ⚠️ Comprehensive error handling
- ⏳ Loading states with spinner

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:

Create a `.env.local` file in the root directory and add your xAI API key:

```env
XAI_API_KEY=your_xai_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Upload an Image**: Drag and drop an image onto the upload area, or click to select a file from your device.

2. **Enter Edit Prompt**: Type a description of how you want to edit the image (e.g., "Add a sunset in the background", "Make it black and white", "Add snow").

3. **Edit Image**: Click the "Edit Image" button to process your request.

4. **View Result**: The edited image will appear on the right side once processing is complete.

5. **Reset**: Click the X button on the original image to start over with a new image.

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **API**: xAI Image Editing API

## API Route

The app includes a secure API route at `/api/edit-image` that:
- Accepts POST requests with image data and prompt
- Forwards requests to the xAI API
- Keeps your API key secure on the server
- Returns the edited image URL

## Environment Variables

- `XAI_API_KEY`: Your xAI API key (required)

## Build

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```
