import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { isMockApiActive } from './lib/api-mode';

async function enableMocking() {
  if (!isMockApiActive()) {
    return;
  }

  const { worker } = await import('./mocks/browser');

  // Start the worker with onUnhandledRequest set to 'bypass'
  // This allows real API calls to pass through for endpoints not mocked
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
