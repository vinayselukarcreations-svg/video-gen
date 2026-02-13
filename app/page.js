'use client';

import { useState, useCallback } from 'react';
import { Upload, Wand2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [originalImage, setOriginalImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
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

  const handleFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      setOriginalImage(base64);
      setEditedImage(null);
      setError('');
    } catch (err) {
      setError('Failed to load image');
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    await handleFile(file);
  }, []);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    await handleFile(file);
  };

  const handleEditImage = async () => {
    if (!originalImage || !prompt.trim()) {
      setError('Please upload an image and enter a prompt');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
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
      setError(err.message || 'Failed to edit image');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            AI Image Editor
          </h1>
          <p className="text-slate-600 text-lg">
            Upload an image and describe how you want to edit it
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Original Image
            </h2>
            {!originalImage ? (
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 mb-2">
                  Drag and drop an image here, or click to select
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleChange}
                />
                <Button
                  onClick={() => document.getElementById('file-upload').click()}
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
                  className="w-full rounded-lg shadow-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleReset}
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
            {loading ? (
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
                className="w-full rounded-lg shadow-lg"
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
                htmlFor="prompt"
                className="block text-sm font-medium text-slate-900 mb-2"
              >
                Edit Prompt
              </label>
              <Input
                id="prompt"
                type="text"
                placeholder="e.g., Add a sunset in the background, make it black and white, add snow..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                className="text-base"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={handleEditImage}
              disabled={!originalImage || !prompt.trim() || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
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
      </div>
    </div>
  );
}
