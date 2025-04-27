
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you are looking for doesn't exist or has been moved.</p>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    </div>
  );
}
