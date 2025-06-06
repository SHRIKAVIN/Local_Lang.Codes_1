import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Settings, Menu, X, Code, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config';

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
  const mobileMenuRef = useRef(null);

  const fetchUserData = async (token) => {
    try {
      const response = await fetch(API_ENDPOINTS.USER, {
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
    } else if (storedUser) {
       // If token is not present but user is in localStorage, clear user as it's invalid
       localStorage.removeItem('user');
       setUser(null);
    }
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
         setShowMobileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, showNotifications, showMobileMenu]);


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
      const response = await fetch(API_ENDPOINTS.HISTORY, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.error) {
        setNotificationsError(data.error);
        setNotifications([]);
      } else if (data.history) {
        // Sort history by timestamp
        const sortedHistory = data.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(sortedHistory);
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
  // Check if on App Plan Generator page
  const isAppPlanGeneratorPage = location.pathname === '/app-plan';


  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900">LocalLang.Codes</Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/code"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isCodeGeneratorPage
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                 <Code className="mr-2" size={20} />Code Generator
              </Link>
              <Link
                to="/app-plan"
                 className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                   isAppPlanGeneratorPage
                     ? 'border-blue-500 text-gray-900'
                     : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                 }`}
              >
                <Terminal className="mr-2" size={20} />App Plan Generator
              </Link>
               {/* Add other desktop links here if needed */}
            </div>
          </div>

          {/* Right side - Auth Links / User Menu */}
          <div className="flex items-center">
            {!isLoggedIn ? (
              <div className="hidden sm:flex sm:items-center sm:ml-6 space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="hidden sm:ml-6 sm:flex sm:items-center relative">
                {/* Notifications Icon */}
                 <div className="relative" ref={notificationsRef}>
                   <button
                     type="button"
                     className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                     onClick={handleNotificationClick}
                   >
                     <span className="sr-only">View notifications</span>
                     <Bell className="h-6 w-6" aria-hidden="true" />
                   </button>
                   {/* Notifications Dropdown */}
                   {showNotifications && (
                     <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        {isLoadingNotifications ? (
                           <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin text-blue-600" size={24} /></div>
                        ) : notificationsError ? (
                            <p className="text-red-600 text-sm p-4">{notificationsError}</p>
                        ) : notifications.length > 0 ? (
                           <div className="py-1 max-h-60 overflow-y-auto">
                              {notifications.map((notification, index) => (
                                 <div key={index} className="block px-4 py-2 text-sm text-gray-700 border-b last:border-b-0">
                                     <p className="font-medium capitalize">{notification.type || 'Generation'}</p>
                                     <p className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</p>
                                     {/* Displaying part of the input/output, adjust as needed */}
                                     {notification.input && <p className="text-xs text-gray-600 truncate">Input: {notification.input}</p>}
                                      {notification.output && <p className="text-xs text-gray-600 truncate">Output: {notification.output}</p>}
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <p className="text-gray-600 text-sm p-4">No new notifications.</p>
                        )}
                     </div>
                   )}
                 </div>

                {/* Profile dropdown */}
                <div className="ml-3 relative" ref={profileMenuRef}>
                  <div>
                    <button
                      type="button"
                      className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                      id="user-menu-button"
                      aria-expanded="false"
                      aria-haspopup="true"
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                      <span className="sr-only">Open user menu</span>
                      {/* User Icon or Avatar */}
                      <User className="h-8 w-8 rounded-full text-gray-300" />
                    </button>
                  </div>
                  {showProfileMenu && (
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <span className="block px-4 py-2 text-sm text-gray-700">{user?.name || 'User'}</span>
                       <Link
                         to="/profile"
                         className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                         role="menuitem"
                         onClick={() => setShowProfileMenu(false)}
                       >
                        <User className="mr-2 inline-block" size={16} /> Your Profile
                      </Link>
                       <Link
                         to="/settings"
                         className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                         role="menuitem"
                         onClick={() => setShowProfileMenu(false)}
                       >
                         <Settings className="mr-2 inline-block" size={16} /> Settings
                       </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <LogOut className="mr-2 inline-block" size={16} /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <span className="sr-only">Open main menu</span>
                {showMobileMenu ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {showMobileMenu && (
        <div className="sm:hidden" id="mobile-menu" ref={mobileMenuRef}>
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/code"
               className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                 isCodeGeneratorPage
                   ? 'border-blue-500 bg-blue-50 text-blue-700'
                   : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
               }`}
              onClick={() => setShowMobileMenu(false)}
            >
               <Code className="mr-2 inline-block" size={20} /> Code Generator
            </Link>
            <Link
              to="/app-plan"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isAppPlanGeneratorPage
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
              onClick={() => setShowMobileMenu(false)}
            >
               <Terminal className="mr-2 inline-block" size={20} /> App Plan Generator
            </Link>
            {/* Add other mobile links here if needed */}
          </div>
           {isLoggedIn ? (
             <div className="pt-4 pb-3 border-t border-gray-200">
               <div className="flex items-center px-5">
                 <div className="flex-shrink-0">
                    {/* User Icon or Avatar */}
                   <User className="h-10 w-10 rounded-full text-gray-400" />
                 </div>
                 <div className="ml-3">
                   <div className="text-base font-medium text-gray-800">{user?.name || 'User'}</div>
                   <div className="text-sm font-medium text-gray-500">{user?.email || 'N/A'}</div>
                 </div>
                  {/* Mobile Notifications Icon */}
                  <button
                    type="button"
                    className="ml-auto flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={handleNotificationClick} // Use the existing handler
                  >
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-6 w-6" aria-hidden="true" />
                  </button>
               </div>
               {/* Mobile Notifications Dropdown (simple) */}
                {showNotifications && notifications.length > 0 && (
                     <div className="mt-2 space-y-1 px-2">
                        {notifications.map((notification, index) => (
                           <div key={index} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 border-b last:border-b-0">
                              <p className="font-medium capitalize">{notification.type || 'Generation'}</p>
                               <p className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</p>
                           </div>
                        ))}
                     </div>
                 )}
               <div className="mt-3 px-2 space-y-1">
                 <Link
                   to="/profile"
                   className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                   onClick={() => setShowMobileMenu(false)}
                 >
                   Your Profile
                 </Link>
                  <Link
                    to="/settings"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Settings
                  </Link>
                 <button
                   onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                   className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                 >
                   Sign out
                 </button>
               </div>
             </div>
           ) : (
             <div className="py-4 px-5 space-y-2 border-t border-gray-200">
                <Link
                   to="/login"
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
                 <Link
                   to="/signup"
                   className="block w-full px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 text-center"
                   onClick={() => setShowMobileMenu(false)}
                 >
                   Sign Up
                 </Link>
             </div>
           )}
        </div>
      )}
    </nav>
  );
};

export default Navbar; 