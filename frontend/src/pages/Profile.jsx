import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Code, Globe, Clock } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));

    // Mock recent activity data
    setRecentActivity([
      {
        type: 'code',
        title: 'Python Calculator',
        language: 'Tamil',
        date: '2024-03-15',
        icon: <Code className="w-5 h-5" />
      },
      {
        type: 'website',
        title: 'Portfolio Website',
        language: 'Hindi',
        date: '2024-03-14',
        icon: <Globe className="w-5 h-5" />
      },
      {
        type: 'code',
        title: 'Data Analysis Script',
        language: 'Telugu',
        date: '2024-03-13',
        icon: <Code className="w-5 h-5" />
      }
    ]);
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Profile Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-12 w-12 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <div className="mt-2 flex items-center text-gray-500">
                  <Mail className="h-5 w-5 mr-2" />
                  <span>{user.email}</span>
                </div>
                <div className="mt-1 flex items-center text-gray-500">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>Member since {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="px-6 py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {activity.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{activity.title}</h3>
                      <p className="text-sm text-gray-500">
                        Generated in {activity.language}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">{activity.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 py-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="text-blue-600 mb-2">
                  <Code className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Code Generations</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-lg">
                <div className="text-indigo-600 mb-2">
                  <Globe className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Websites Created</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="text-purple-600 mb-2">
                  <Clock className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Hours Saved</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">42</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 