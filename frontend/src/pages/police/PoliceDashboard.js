import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Bell, Settings, MapPin, Clock, AlertCircle, Check, X, ChevronRight } from 'lucide-react';

// Helper function to format date
const formatDate = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Severity Badge Component
const SeverityBadge = ({ severity }) => {
  const getSeverityColor = (level) => {
    switch(level.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}>
      {severity}
    </span>
  );
};

const defaultUser = {
    name: 'Chennai Police',
    organizationName: 'Chennai',
    email: 'Chennaipol@apollohospital.com',
    role: 'Office of Chennai',
  };

// Incident detail Modal
const IncidentDetailModal = ({ incident, onClose }) => {
  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Accident Report #{incident.id}</h2>
        <p className="text-sm text-gray-600 mb-2"><MapPin className="inline h-4 w-4 mr-1" /> {incident.location}</p>
        <p className="text-sm text-gray-600 mb-2"><Clock className="inline h-4 w-4 mr-1" /> {formatDate(incident.timestamp)}</p>
        <SeverityBadge severity={incident.severity} />
        {incident.image && (
          <img src={incident.image} alt="Accident scene" className="mt-4 rounded shadow" />
        )}
        <p className="mt-4 text-sm text-gray-700">{incident.description}</p>
        <p className="mt-4 text-sm text-gray-700">Status: <strong>{incident.status}</strong></p>
      </div>
    </div>
  );
};

// Incident Card Component
const IncidentCard = ({ incident, onAccept, onReject, onViewDetails }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Accident Report #{incident.id}
          </h3>
          <SeverityBadge severity={incident.severity} />
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <p>{incident.location}</p>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <p>{formatDate(incident.timestamp)}</p>
        </div>
      </div>
      <div className="px-4 py-4 sm:px-6">
        {incident.image && (
          <div className="mb-4">
            <video
              src={incident.image} 
              alt="Accident scene" 
              className="w-full h-48 object-cover rounded"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onAccept(incident.id)}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Check className="mr-2 h-4 w-4" />
            Accept
          </button>

        </div>
        <button
          onClick={() => onViewDetails(incident)}
          className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md border mt-4"
        >
          View Details <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Sample data
const sampleIncidents = [
  {
    id: 1,
    location: 'No. 12, Anna Salai, Teynampet, Chennai',
    timestamp: '2025-05-01T10:00:00Z',
    severity: 'Moderate',
    status: 'pending',
    image: "C:\\Users\\bhav0\\safesight\\1.mp4",
    isRead: false,
    description: 'Car and motorcycle collided in a moderate accident- Vehicle number Car: TN0657 Motorcycle: TN0879, Speed: 70kmph, 60kmph',
    coordinates: { lat: 13.0418, lng: 80.2341 },
    detectedBy: 'CCTV Camera #205'
  },
  {
    id: 2,
    location: '45, 2nd Avenue, Besant Nagar, Chennai',
    timestamp: '2025-05-01T09:00:00Z',
    severity: 'Moderate',
    status: 'accepted',
    image: 'C:\\Users\\bhav0\\safesight\\2.mp4',
    isRead: false,
    description: '2 Car and Truck collision- Vehicle number Car: TN1155, TN0999 Truck: TN9034, Speed: 60kmph',
    coordinates: { lat: 13.0002, lng: 80.2668 },
    detectedBy: 'CCTV Camera #118'
  },
  {
    id: 3,
    location: 'Near Marina Beach, Triplicane, Chennai',
    timestamp: '2025-04-30T22:15:00Z',
    severity: 'Critical',
    status: 'pending',
    image: 'https://via.placeholder.com/400x200?text=Emergency',
    isRead: false,
    description: 'A truck collision resulting in fire- Vehicle number Truck: TN5795',
    coordinates: { lat: 13.0566, lng: 80.2631 },
    detectedBy: 'CCTV Camera #056'
  }
];



const EmptyState = () => (
  <div className="text-center py-16">
    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents</h3>
    <p className="mt-1 text-sm text-gray-500">
      There are no active incidents to display at this time.
    </p>
  </div>
);

// Notification Dropdown Component
const NotificationDropdown = ({ notifications, onClose, onMarkAllRead }) => {
  const navigate = useNavigate();

  const handleNotificationClick = (link) => {
    navigate(link);
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-10 border border-gray-200">
      <div className="py-1">
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button 
              onClick={onMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id} 
                className={`block px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification.link)}
              >
                <div className="flex items-start">
                  <div className="ml-3 w-0 flex-1">
                    <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-bold' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No new notifications
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PoliceDashboard = () => {
  const navigate = useNavigate();
  const { currentUser = defaultUser, logout } = useAuth();
  const [incidents, setIncidents] = useState(sampleIncidents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Handle incident acceptance
  const handleAcceptIncident = (incidentId) => {
    const updatedIncidents = incidents.map(incident => 
      incident.id === incidentId 
        ? { ...incident, status: 'accepted' }
        : incident
    );
    
    setIncidents(updatedIncidents);
    
    // Add notification
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
      const newNotification = {
        id: Date.now(),
        title: 'Incident Accepted',
        message: `You've accepted incident at ${incident.location}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        link: `/Policel/incident/${incidentId}`
      };
      setNotifications(prev => [newNotification, ...prev]);
      setHasUnreadNotifications(true);
    }
  };

  // Handle incident rejection
  const handleRejectIncident = (incidentId) => {
    setIncidents(prev => prev.filter(incident => incident.id !== incidentId));
    
    // Remove related notifications
    setNotifications(prev => 
      prev.filter(notification => 
        !notification.link.includes(`/Policel/incident/${incidentId}`)
      )
    );
  };

  // Handle marking all notifications as read
  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setHasUnreadNotifications(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showNotifications || showSettings || showProfile) {
        setShowNotifications(false);
        setShowSettings(false);
        setShowProfile(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showSettings, showProfile]);

  // Filter incidents by status
  const pendingIncidents = incidents.filter(i => i.status === 'pending');
  const acceptedIncidents = incidents.filter(i => i.status === 'accepted');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">SafeSight</span>
                </Link>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link 
                  to="/Policel/dashboard" 
                  className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                    setShowSettings(false);
                    setShowProfile(false);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative"
                >
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-6 w-6" />
                  {hasUnreadNotifications && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationDropdown 
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onMarkAllRead={handleMarkAllNotificationsRead}
                  />
                )}
              </div>
              
              <div className="relative ml-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(!showSettings);
                    setShowNotifications(false);
                    setShowProfile(false);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Settings</span>
                  <Settings className="h-6 w-6" />
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <button
                      onClick={() => navigate('/Policel/settings')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Account Settings
                    </button>
                    <button
                      onClick={() => navigate('/Policel/preferences')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Preferences
                    </button>
                  </div>
                )}
              </div>
              
              <div className="ml-3 relative">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfile(!showProfile);
                    setShowNotifications(false);
                    setShowSettings(false);
                  }}
                  className="flex items-center cursor-pointer"
                >
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {currentUser?.name || 'Policel User'}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {currentUser?.organizationName || 'Policel'}
                    </div>
                  </div>
                </div>
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                      <p className="text-sm text-gray-500 truncate">{currentUser?.email}</p>
                    </div>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => navigate('/Policel/profile')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </button>
                    <button
                      onClick={() => navigate('/Policel/settings')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Policel Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back, {currentUser?.name || 'User'} from {currentUser?.organizationName || 'Policel'}
            </p>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Pending Incidents Section */}
            <div className="px-4 py-8 sm:px-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Incidents</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading incidents...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              ) : pendingIncidents.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pendingIncidents.map(incident => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onAccept={handleAcceptIncident}
                      onReject={handleRejectIncident}
                      onViewDetails={setSelectedIncident}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
            
            {/* Accepted Incidents Section */}
            <div className="px-4 py-8 sm:px-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Accepted Incidents</h2>
              
              {!loading && !error && acceptedIncidents.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {acceptedIncidents.map(incident => (
                    <div key={incident.id} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Accident Report #{incident.id}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Accepted
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>{incident.location}</p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>{formatDate(incident.timestamp)}</p>
                        </div>
                      </div>
                      <div className="px-4 py-4 sm:px-6">
                        <button 
                          onClick={() => setSelectedIncident(incident)}
                          className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                        >
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No accepted incidents to display</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
};

export default PoliceDashboard;