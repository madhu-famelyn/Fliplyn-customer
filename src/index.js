import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // ✅ import
import axios from 'axios';

// Global Axios interceptor to dynamically rewrite the production API URL to the local backend URL in development
axios.interceptors.request.use(
  (config) => {
    const targetBaseUrl = process.env.REACT_APP_API_URL || 'https://admin-aged-field-2794.fly.dev';
    if (config.baseURL && config.baseURL.includes('admin-aged-field-2794.fly.dev')) {
      config.baseURL = config.baseURL.replace('https://admin-aged-field-2794.fly.dev', targetBaseUrl);
    }
    if (config.url && config.url.includes('admin-aged-field-2794.fly.dev')) {
      config.url = config.url.replace('https://admin-aged-field-2794.fly.dev', targetBaseUrl);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global Fetch interceptor to dynamically rewrite the production API URL to the local backend URL in development
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const targetBaseUrl = process.env.REACT_APP_API_URL || 'https://admin-aged-field-2794.fly.dev';
  let modifiedInput = input;
  if (typeof input === 'string') {
    if (input.includes('admin-aged-field-2794.fly.dev')) {
      modifiedInput = input.replace('https://admin-aged-field-2794.fly.dev', targetBaseUrl);
    }
  } else if (input instanceof URL) {
    if (input.href.includes('admin-aged-field-2794.fly.dev')) {
      modifiedInput = new URL(input.href.replace('https://admin-aged-field-2794.fly.dev', targetBaseUrl));
    }
  } else if (input instanceof Request) {
    if (input.url.includes('admin-aged-field-2794.fly.dev')) {
      const newUrl = input.url.replace('https://admin-aged-field-2794.fly.dev', targetBaseUrl);
      modifiedInput = new Request(newUrl, input);
    }
  }
  return originalFetch(modifiedInput, init);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

