import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config';

const Profile = () => {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    // Fetch Generation History
    const fetchHistory = async () => {
      if (!user) return;
      
      try {
        const response = await authenticatedFetch(API_ENDPOINTS.HISTORY);
        if (response.error) {
          setHistoryError(response.error);
        } else {
          setHistory(response.history || []);
        }
      } catch (err) {
        setHistoryError('Failed to fetch generation history.');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (user) {
      fetchHistory();
    }

  }, [user, loading, navigate]);

   // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return 'Invalid Date';
    }
  };

  if (loading || isLoadingHistory) {
    return ( <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div> );
  }

  if (!user) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="flex items-center p-4 text-sm text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50" role="alert">
                  <AlertCircle className="flex-shrink-0 inline w-4 h-4 me-3" />
                  <div><span className="font-medium">Warning:</span> User data not found. Please try logging in again.</div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - User Info */}
          <div className="md:col-span-1 bg-white rounded-xl shadow-md p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center"><User className="mr-2" size={20} />User Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Name:</p>
                <p className="mt-1 text-gray-900">{user.name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email:</p>
                <p className="mt-1 text-gray-900 flex items-center"><Mail className="mr-1" size={16} />{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Account Created:</p>
                <p className="mt-1 text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              {/* Add other user info here as needed */}
            </div>
          </div>

          {/* Right Column - Generation History */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center"><Clock className="mr-2" size={20} />Generation History</h2>
             {historyError && (
              <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="mr-2" size={16} />{historyError}</p>
            )}
            {history.length > 0 ? (
              <ul className="space-y-4">
                {history.map((item, index) => (
                  <li key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">{item.type || 'Generation'}</span>
                      <span className="text-xs text-gray-500 flex items-center"><Clock className="mr-1" size={12} />{formatTimestamp(item.created_at)}</span>
                    </div>
                    {item.input && (
                         <div className="mb-2">
                            <p className="text-xs font-medium text-gray-600">Input:</p>
                             <p className="text-sm text-gray-800 whitespace-pre-wrap break-words line-clamp-2">{item.input}</p>
                        </div>
                     )}
                    {item.explanation && (
                        <div className="mt-2">
                             <p className="text-xs font-medium text-gray-600">Explanation:</p>
                             <p className="text-sm text-gray-800 whitespace-pre-wrap break-words line-clamp-2">{item.explanation}</p>
                        </div>
                    )}
                     {item.output && (
                         <div>
                              <p className="text-xs font-medium text-gray-600">Output:</p>
                              {/* Display truncated output with option to view full if needed */}
                              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words line-clamp-3">{item.output}</p>
                         </div>
                     )}
                     {/* Add more details here if available in history item */}
                  </li>
                ))}
              </ul>
            ) : ( !historyError && (
              <p className="text-gray-600">No generation history available.</p>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile; 