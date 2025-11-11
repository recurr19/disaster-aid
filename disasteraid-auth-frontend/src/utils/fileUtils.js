/**
 * Utility functions for file handling
 */

import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from './constants';

/**
 * Validate file type
 */
export const isValidFileType = (file) => {
  return Object.keys(ACCEPTED_FILE_TYPES).some(type => file.type === type);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file) => {
  return file.size <= MAX_FILE_SIZE;
};

/**
 * Validate array of files
 */
export const validateFiles = (files) => {
  const invalidFiles = files.filter(file => !isValidFileType(file));
  if (invalidFiles.length > 0) {
    return {
      valid: false,
      error: 'Please upload only images (JPG, PNG) or audio files (MP3, WAV, OGG)'
    };
  }

  const oversizedFiles = files.filter(file => !isValidFileSize(file));
  if (oversizedFiles.length > 0) {
    return {
      valid: false,
      error: 'Each file must be less than 10MB'
    };
  }

  return { valid: true };
};

/**
 * Check if file is an image
 */
export const isImage = (file) => file.type.startsWith('image/');

/**
 * Check if file is audio
 */
export const isAudio = (file) => file.type.startsWith('audio/');

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Create form data with files and other data
 */
export const createFormDataWithFiles = (data, files) => {
  const formData = new FormData();

  // Append basic form data
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => formData.append(key + '[]', item));
    } else {
      formData.append(key, value);
    }
  });

  // Append files
  files.forEach(file => {
    formData.append('files[]', file);
  });

  return formData;
};
