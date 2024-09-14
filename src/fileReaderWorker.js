// fileReaderWorker.js

self.onmessage = (e) => {
  const file = e.data;
  
  if (!(file instanceof File)) {
    console.error('Expected a File object but received:', file);
    return;
  }

  postMessage({
    name: file.name,
    content: '',
    loading: true
  });
  
  console.log('Worker started processing file:', file.name);

  const reader = new FileReader();

  reader.onloadend = () => {
    const base64String = reader.result?.split(',')[1] || '';
    const result = {
      name: file.name,
      content: base64String,
      loading: false
    };
    console.log('Worker completed processing file:', result);
    postMessage(result);
  };

  reader.onerror = (error) => {
    console.error('Error reading file:', file.name, error);
    const result = {
      name: file.name,
      content: '',
      loading: false
    };
    postMessage(result);
  };

  reader.readAsDataURL(file);
};
