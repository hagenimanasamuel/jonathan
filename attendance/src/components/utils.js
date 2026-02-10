// src/utils.js
export const showSnackbar = (message, severity = 'success') => {
  // Implementation depends on your notification system
  console.log(`${severity.toUpperCase()}: ${message}`);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};