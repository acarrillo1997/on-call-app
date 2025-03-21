'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocs() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/swagger')
      .then((response) => response.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error('Failed to load API spec:', err));
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
      {spec ? (
        <SwaggerUI spec={spec} />
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading API documentation...</p>
        </div>
      )}
    </div>
  );
} 