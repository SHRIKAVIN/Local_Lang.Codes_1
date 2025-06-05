import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Settings, Menu, X, Code, Loader2 } from 'lucide-react';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState('');
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const fetchUserData = async (token) => {
    try {
      const response = await fetch('http://localhost:5007/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.error) {
        console.error('Error fetching user data:', data.error);
        // If token is invalid, clear storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
        navigate('/login');
      } else if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      // If there's an error, clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUser(null);
      navigate('/login');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    setIsLoggedIn(!!token);
    if (token) {
      fetchUserData(token);
    }
  }, [location.pathname]);

  // Close profile menu when clicking outside
  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Close notifications menu when clicking outside
  useEffect(() => {
    if (!showNotifications) return;
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchNotifications = async () => {
    if (isLoadingNotifications) return;
    setIsLoadingNotifications(true);
    setNotificationsError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // User not logged in, no notifications to fetch
        setIsLoadingNotifications(false);
        return;
      }
      const response = await fetch('http://localhost:5007/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.error) {
        setNotificationsError(data.error);
        setNotifications([]);
      } else if (data.history) {
        setNotifications(data.history);
      } else {
        setNotificationsError('Unexpected response format for notifications.');
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotificationsError('Failed to fetch notifications.');
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleNotificationClick = () => {
    if (!showNotifications) {
      fetchNotifications(); // Fetch when opening
    }
    setShowNotifications(!showNotifications);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  // Check if on Code Generator page
  const isCodeGeneratorPage = location.pathname === '/code';

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Code className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-blue-600">LocalLang.Codes</span>
            </Link>
            {isLoggedIn && (
              <div className="hidden md:flex md:ml-10 space-x-8">
                <Link
                  to="/code"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Code Generator
                </Link>
                <Link
                  to="/app-plan"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  App Plan
                </Link>
              </div>
            )}
            {/* Always show Pricing link */}
            <div className="hidden md:flex ml-10">
              <Link
                to="/pricing"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Right Side Navigation */}
          <div className="flex items-center">
            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <button
                  onClick={handleNotificationClick}
                  className="p-2 text-gray-700 hover:text-blue-600 relative"
                  ref={notificationsRef}
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">Recent Activity</div>
                    {isLoadingNotifications && (
                      <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
                      </div>
                    )}
                    {notificationsError && (
                      <div className="px-4 py-2 text-sm text-red-600">{notificationsError}</div>
                    )}
                    {!isLoadingNotifications && !notificationsError && notifications.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">No recent activity.</div>
                    )}
                    {!isLoadingNotifications && !notificationsError && notifications.length > 0 && (
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.map((item, index) => (
                          <div key={index} className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-100 last:border-b-0">
                            <p className="font-medium">{item.type === 'code' ? 'Code Generated' : 'App Plan Generated'}</p>
                            <p className="text-gray-600 truncate">{item.input}</p>
                            <p className="text-gray-500 text-xs">{new Date(item.timestamp).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Menu */}
                <div className="ml-4 relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center text-gray-700 hover:text-blue-600"
                  >
                    <div className="flex items-center">
                      <User className="h-6 w-6" />
                      <span className="ml-2 text-sm font-medium hidden md:block">
                        {user?.name || 'User'}
                      </span>
                    </div>
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <p className="font-medium">{user?.name || 'User'}</p>
                        <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden ml-4 p-2 text-gray-700 hover:text-blue-600"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isLoggedIn ? (
              <>
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/code"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Code Generator
                </Link>
                <Link
                  to="/app-plan"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  App Plan
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Sign up
                </Link>
              </>
            )}
            {/* Always show Pricing link in mobile menu */}
            <Link
              to="/pricing"
              className="block w-full text-center bg-blue-600 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
            >
              Pricing
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 