/**
 * Utility functions for offline queue management
 */

const QUEUE_KEY = 'disaster_aid_pending_requests';

/**
 * Save request to localStorage queue
 */
export const saveToQueue = (formData) => {
  try {
    const existingQueue = getQueue();
    
    const requestData = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      data: {},
      files: []
    };

    // Extract form data
    for (let [key, value] of formData.entries()) {
      if (key === 'files[]') {
        requestData.files.push({
          name: value.name,
          type: value.type,
          size: value.size
        });
      } else {
        requestData.data[key] = value;
      }
    }

    existingQueue.push(requestData);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(existingQueue));
    
    return requestData.id;
  } catch (error) {
    console.error('Error saving request to queue:', error);
    return null;
  }
};

/**
 * Get all queued requests
 */
export const getQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch (error) {
    console.error('Error reading queue:', error);
    return [];
  }
};

/**
 * Remove request from queue
 */
export const removeFromQueue = (requestId) => {
  try {
    const queue = getQueue();
    const updatedQueue = queue.filter(q => q.id !== requestId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    return updatedQueue;
  } catch (error) {
    console.error('Error removing from queue:', error);
    return getQueue();
  }
};

/**
 * Clear entire queue
 */
export const clearQueue = () => {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing queue:', error);
  }
};

/**
 * Convert queued request back to FormData
 */
export const queuedRequestToFormData = (queuedRequest) => {
  const formData = new FormData();
  
  Object.entries(queuedRequest.data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return formData;
};
