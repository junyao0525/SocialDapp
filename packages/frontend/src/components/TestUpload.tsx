import { useState } from 'react';

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setUploadedUrl('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload file");
      }

      const data = await response.json();
      setUploadedUrl(data.url);
      console.log('Upload successful! URL:', data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Test Pinata Upload</h2>
      
      <div className="mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`px-4 py-2 rounded-md text-white font-medium
          ${!file || uploading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {uploading ? 'Uploading...' : 'Upload to Pinata'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {uploadedUrl && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Uploaded File URL:</h3>
          <div className="p-3 bg-gray-100 rounded-md break-all">
            <a 
              href={uploadedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {uploadedUrl}
            </a>
          </div>
          {file?.type.startsWith('image/') && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Preview:</h3>
              <img 
                src={uploadedUrl} 
                alt="Uploaded file preview" 
                className="max-w-full rounded-md"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 