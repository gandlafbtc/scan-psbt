export const downloadTextAsFile = async (text: string, filename = 'download.txt') => {
  // Create a blob from the text with appropriate MIME type
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = filename; // Set the filename for the download
  document.body.appendChild(a);
  
  // Trigger the download
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Free up memory
  }, 100);
}
