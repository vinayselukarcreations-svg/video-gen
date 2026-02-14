'use client';

import { useState, useCallback } from 'react';
import { Upload, Wand2, X, Film, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [activeTab, setActiveTab] = useState('image');

  // Image editing states
  const [originalImage, setOriginalImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageDragActive, setImageDragActive] = useState(false);

  // Video editing states
  const [originalVideo, setOriginalVideo] = useState(null);
  const [editedVideo, setEditedVideo] = useState(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [videoDragActive, setVideoDragActive] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoRequestId, setVideoRequestId] = useState(null);

  // Image handlers
  const handleImageDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setImageDragActive(true);
    } else if (e.type === 'dragleave') {
      setImageDragActive(false);
    }
  }, []);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please upload an image file');
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      setOriginalImage(base64);
      setEditedImage(null);
      setImageError('');
    } catch (err) {
      setImageError('Failed to load image');
    }
  };

  const handleImageDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);

    const file = e.dataTransfer.files?.[0];
    await handleImageFile(file);
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    await handleImageFile(file);
  };

  const handleEditImage = async () => {
    if (!originalImage || !imagePrompt.trim()) {
      setImageError('Please upload an image and enter a prompt');
      return;
    }

    setImageLoading(true);
    setImageError('');

    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          image: originalImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit image');
      }

      if (data.url) {
        setEditedImage(data.url);
      }
    } catch (err) {
      setImageError(err.message || 'Failed to edit image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleImageReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setImagePrompt('');
    setImageError('');
  };

  // Video handlers
  const handleVideoDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setVideoDragActive(true);
    } else if (e.type === 'dragleave') {
      setVideoDragActive(false);
    }
  }, []);

  const handleVideoFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setVideoError('Please upload a video file');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalVideo(e.target.result);
        setVideoUrl(e.target.result);
        setEditedVideo(null);
        setVideoError('');
      };
      reader.onerror = () => {
        setVideoError('Failed to load video');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setVideoError('Failed to process video');
    }
  };

  const handleVideoDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setVideoDragActive(false);

    const file = e.dataTransfer.files?.[0];
    await handleVideoFile(file);
  }, []);

  const handleVideoChange = async (e) => {
    const file = e.target.files?.[0];
    await handleVideoFile(file);
  };

  const pollVideoResult = async (requestId) => {
    const maxAttempts = 60;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/api/edit-video?request_id=${requestId}`);
        const data = await response.json();

        if (response.status === 200) {
          return data.url;
        }

        if (response.status === 202) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        }

        throw new Error(data.error || 'Failed to get video result');
      } catch (err) {
        if (attempt === maxAttempts - 1) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Video editing timeout');
  };

  const handleEditVideo = async () => {
    if (!videoUrl || !videoPrompt.trim()) {
      setVideoError('Please upload a video and enter a prompt');
      return;
    }

    setVideoLoading(true);
    setVideoError('');

    try {
      const response = await fetch('/api/edit-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          videoUrl: videoUrl,
        }),
      });

      const data = await response.json();

      if (response.status === 202) {
        if (data.request_id) {
          setVideoRequestId(data.request_id);
          const videoUrl = await pollVideoResult(data.request_id);
          setEditedVideo(videoUrl);
        } else {
          throw new Error('No request ID returned');
        }
      } else if (!response.ok) {
        throw new Error(data.error || 'Failed to edit video');
      }
    } catch (err) {
      setVideoError(err.message || 'Failed to edit video');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleVideoReset = () => {
    setOriginalVideo(null);
    setEditedVideo(null);
    setVideoUrl('');
    setVideoPrompt('');
    setVideoError('');
    setVideoRequestId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            AI Media Editor
          </h1>
          <p className="text-slate-600 text-lg">
            Edit images and videos with AI-powered transformations
          </p>
        </div>

        <div className="flex gap-2 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('image')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'image'
                ? 'text-slate-900 border-b-2 border-slate-900 -mb-px'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Image Editor
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'video'
                ? 'text-slate-900 border-b-2 border-slate-900 -mb-px'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Film className="w-4 h-4" />
            Video Editor
          </button>
        </div>

        {activeTab === 'image' && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Original Image
                </h2>
                {!originalImage ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      imageDragActive
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    onDragEnter={handleImageDrag}
                    onDragLeave={handleImageDrag}
                    onDragOver={handleImageDrag}
                    onDrop={handleImageDrop}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 mb-2">
                      Drag and drop an image here, or click to select
                    </p>
                    <input
                      type="file"
                      id="image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <Button
                      onClick={() => document.getElementById('image-upload').click()}
                      className="mt-4"
                    >
                      Choose File
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="w-full rounded-lg shadow-lg max-h-96 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleImageReset}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Edited Image
                </h2>
                {imageLoading ? (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Editing image...</p>
                    </div>
                  </div>
                ) : editedImage ? (
                  <img
                    src={editedImage}
                    alt="Edited"
                    className="w-full rounded-lg shadow-lg max-h-96 object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg">
                    <div className="text-center text-slate-400">
                      <Wand2 className="w-12 h-12 mx-auto mb-4" />
                      <p>Your edited image will appear here</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="image-prompt"
                    className="block text-sm font-medium text-slate-900 mb-2"
                  >
                    Edit Prompt
                  </label>
                  <Input
                    id="image-prompt"
                    type="text"
                    placeholder="e.g., Add a sunset in the background, make it black and white, add snow..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    disabled={imageLoading}
                    className="text-base"
                  />
                </div>

                {imageError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{imageError}</p>
                  </div>
                )}

                <Button
                  onClick={handleEditImage}
                  disabled={!originalImage || !imagePrompt.trim() || imageLoading}
                  className="w-full"
                  size="lg"
                >
                  {imageLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Editing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Edit Image
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'video' && (
          <>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Original Video
                </h2>
                {!originalVideo ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      videoDragActive
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                    onDragEnter={handleVideoDrag}
                    onDragLeave={handleVideoDrag}
                    onDragOver={handleVideoDrag}
                    onDrop={handleVideoDrop}
                  >
                    <Film className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 mb-2">
                      Drag and drop a video here, or click to select
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      Maximum 8.7 seconds duration
                    </p>
                    <input
                      type="file"
                      id="video-upload"
                      className="hidden"
                      accept="video/*"
                      onChange={handleVideoChange}
                    />
                    <Button
                      onClick={() => document.getElementById('video-upload').click()}
                      className="mt-4"
                    >
                      Choose File
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <video
                      src={originalVideo}
                      controls
                      className="w-full rounded-lg shadow-lg bg-black max-h-96"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleVideoReset}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Edited Video
                </h2>
                {videoLoading ? (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600">Editing video...</p>
                    </div>
                  </div>
                ) : editedVideo ? (
                  <div>
                    <video
                      src={editedVideo}
                      controls
                      className="w-full rounded-lg shadow-lg bg-black max-h-96 mb-4"
                    />
                    <a
                      href={editedVideo}
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download Video
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg">
                    <div className="text-center text-slate-400">
                      <Wand2 className="w-12 h-12 mx-auto mb-4" />
                      <p>Your edited video will appear here</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="video-prompt"
                    className="block text-sm font-medium text-slate-900 mb-2"
                  >
                    Edit Prompt
                  </label>
                  <Input
                    id="video-prompt"
                    type="text"
                    placeholder="e.g., Give the woman a silver necklace, change the outfit color, add a hat..."
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    disabled={videoLoading}
                    className="text-base"
                  />
                </div>

                {videoError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{videoError}</p>
                  </div>
                )}

                <Button
                  onClick={handleEditVideo}
                  disabled={!originalVideo || !videoPrompt.trim() || videoLoading}
                  className="w-full"
                  size="lg"
                >
                  {videoLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Editing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Edit Video
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
