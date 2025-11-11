import React from 'react';
import { Camera, X, FileAudio, Image as ImageIcon } from 'lucide-react';

/**
 * File uploader component with drag-drop support
 */
const FileUploader = ({ files, onFileSelect, onRemoveFile, uploadError, acceptedTypes }) => {
  const isImage = (file) => file.type.startsWith('image/');
  const isAudio = (file) => file.type.startsWith('audio/');

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const mockEvent = { target: { files: droppedFiles } };
    onFileSelect(mockEvent);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center mb-4">
        <Camera className="h-5 w-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Upload Photos or Audio</h3>
      </div>

      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={Object.values(acceptedTypes).flat().join(',')}
          onChange={onFileSelect}
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-gray-500">
            JPG, PNG images or MP3, WAV, OGG audio files (max 10MB each)
          </p>
        </label>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {uploadError}
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Selected Files ({files.length})
          </h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1">
                {isImage(file) ? (
                  <div className="relative w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : isAudio(file) ? (
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <FileAudio className="h-6 w-6 text-blue-600" />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="ml-3 p-1 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
