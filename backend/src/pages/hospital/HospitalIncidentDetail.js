//HospitalIncidentDetails.js

import { useState, useEffect } from 'react';
import { Bell, Settings, Map, Clock, AlertTriangle, Camera, Check, X, Filter, MapPin, ChevronLeft } from 'lucide-react';

// Mock data for road accidents detected by SafeSight
const mockAccidents = [
  {
    id: "ACC-2025-0428-001",
    location: {
      address: "Highway 101, Mile Marker 42",
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    timestamp: "2025-04-28T14:32:00",
    severity: "Critical",
    imageUrl: "/api/placeholder/640/360",
    status: "Pending",
    description: "Multi-vehicle collision involving 3 vehicles. At least 2 injured passengers visible in footage.",
    detectedBy: "CCTV Camera #104"
  },
  {
    id: "ACC-2025-0428-002",
    location: {
      address: "Intersection of Main St and 5th Ave",
      coordinates: { lat: 37.7833, lng: -122.4167 }
    },
    timestamp: "2025-04-28T15:45:00",
    severity: "Moderate",
    imageUrl: "/api/placeholder/640/360",
    status: "Pending",
    description: "Motorcycle and sedan collision. Motorcycle rider appears injured.",
    detectedBy: "CCTV Camera #087"
  },
  {
    id: "ACC-2025-0427-005",
    location: {
      address: "Downtown Bridge, Eastbound Lane",
      coordinates: { lat: 37.7935, lng: -122.3801 }
    },
    timestamp: "2025-04-27T19:21:00",
    severity: "Major",
    imageUrl: "/api/placeholder/640/360",
    status: "Accepted by Memorial Hospital",
    description: "Single vehicle collision with bridge barrier. Vehicle severely damaged.",
    detectedBy: "CCTV Camera #156"
  }
];

// Severity badge component
const SeverityBadge = ({ severity }) => {
  const severityStyles = {
    "Critical": "bg-red-100 text-red-800",
    "Major": "bg-orange-100 text-orange-800",
    "Moderate": "bg-yellow-100 text-yellow-800",
    "Minor": "bg-blue-100 text-blue-800"
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityStyles[severity] || "bg-gray-100 text-gray-800"}`}>
      {severity}
    </span>
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Accepted": "bg-green-100 text-green-800",
    "Rejected": "bg-red-100 text-red-800",
    "In Progress": "bg-blue-100 text-blue-800"
  };
  
  // Extract just "Accepted" if the status contains "Accepted by"
  const displayStatus = status.startsWith("Accepted") ? "Accepted" : status;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[displayStatus] || "bg-gray-100 text-gray-800"}`}>
      {displayStatus}
    </span>
  );
};

// Map component (simplified placeholder)
const MapView = ({ coordinates }) => {
  return (
    <div className="bg-gray-200 rounded-lg h-64 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <Map size={48} className="mx-auto text-blue-400" />
          <p className="mt-2 text-sm text-gray-600">Map View</p>
          <p className="mt-1 text-xs text-gray-500">Coordinates: {coordinates.lat}, {coordinates.lng}</p>
        </div>
      </div>
    </div>
  );
};

// Main component for SafeSight Hospital Portal
export default function SafeSightHospitalPortal() {
  const [accidents, setAccidents] = useState(mockAccidents);
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'detail', or 'settings'
  const [showNotification, setShowNotification] = useState(false);
  const [filters, setFilters] = useState({
    severity: [],
    region: 'All'
  });
  
  // Simulate real-time notification
  useEffect(() => {
    // Show notification after 5 seconds
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle accident acceptance
  const handleAccept = (accidentId) => {
    setAccidents(accidents.map(acc => 
      acc.id === accidentId 
        ? {...acc, status: "Accepted by Central Hospital"} 
        : acc
    ));
    setView('list');
  };
  
  // Handle accident rejection
  const handleReject = (accidentId) => {
    setAccidents(accidents.map(acc => 
      acc.id === accidentId 
        ? {...acc, status: "Rejected"} 
        : acc
    ));
    setView('list');
  };
  
  // Filter accidents based on settings
  const filteredAccidents = accidents.filter(acc => {
    // Filter by severity if any severities are selected
    if (filters.severity.length > 0 && !filters.severity.includes(acc.severity)) {
      return false;
    }
    
    // Region filtering would be implemented here
    
    return true;
  });
  
  // Dismiss notification
  const dismissNotification = () => {
    setShowNotification(false);
  };
  
  // Go to accident detail view
  const viewAccidentDetail = (accident) => {
    setSelectedAccident(accident);
    setView('detail');
  };
  
  // Render the list view
  const renderListView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">SafeSight - Accident Alerts</h1>
        <div className="flex space-x-2">
          <button 
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            onClick={() => setView('settings')}
          >
            <Settings size={20} />
          </button>
          <div className="relative">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <Bell size={20} />
            </button>
            {accidents.filter(acc => acc.status === "Pending").length > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {accidents.filter(acc => acc.status === "Pending").length}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {showNotification && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-md relative">
          <button 
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            onClick={dismissNotification}
          >
            <X size={16} />
          </button>
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800 font-medium">
                New accident detected at Highway 101, Mile Marker 42!
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Critical severity - Respond immediately
              </p>
              <div className="mt-2">
                <button 
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  onClick={() => {
                    viewAccidentDetail(accidents[0]);
                    dismissNotification();
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccidents.map((accident) => (
          <div 
            key={accident.id} 
            className="border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md cursor-pointer"
            onClick={() => viewAccidentDetail(accident)}
          >
            <div className="relative h-40 bg-gray-100">
              <img 
                src={accident.imageUrl} 
                alt="Accident scene" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-2">
                <SeverityBadge severity={accident.severity} />
                <StatusBadge status={accident.status} />
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-1 truncate">{accident.location.address}</h3>
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <Clock size={14} className="mr-1" />
                {new Date(accident.timestamp).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {accident.description}
              </p>
              
              {accident.status === "Pending" && (
                <div className="flex justify-end mt-3 space-x-2">
                  <button 
                    className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-md hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(accident.id);
                    }}
                  >
                    Reject
                  </button>
                  <button 
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(accident.id);
                    }}
                  >
                    Accept
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredAccidents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No accidents match your current filters</p>
        </div>
      )}
    </div>
  );
  
  // Render the detail view
  const renderDetailView = () => {
    if (!selectedAccident) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="flex items-center p-4 border-b border-gray-200">
          <button 
            className="mr-3 p-2 rounded-full hover:bg-gray-100"
            onClick={() => setView('list')}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Accident Details</h2>
            <p className="text-sm text-gray-500">ID: {selectedAccident.id}</p>
          </div>
        </div>
      
        <div className="p-6">
          {/* Image of the scene */}
          <div className="mb-6 rounded-lg overflow-hidden relative">
            <img 
              src={selectedAccident.imageUrl} 
              alt="Accident scene" 
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 right-2 flex space-x-2">
              <SeverityBadge severity={selectedAccident.severity} />
              <StatusBadge status={selectedAccident.status} />
            </div>
          </div>
        
          {/* Location with map */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin size={16} className="mr-1" /> Location
            </h3>
            <p className="text-sm mb-3">{selectedAccident.location.address}</p>
            <MapView coordinates={selectedAccident.location.coordinates} />
          </div>
          
          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock size={16} className="mr-1" /> Timestamp
              </h3>
              <p className="text-sm">{new Date(selectedAccident.timestamp).toLocaleString()}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <AlertTriangle size={16} className="mr-1" /> Severity
              </h3>
              <p className="text-sm flex items-center">
                <SeverityBadge severity={selectedAccident.severity} />
                <span className="ml-2">{selectedAccident.severity}</span>
              </p>
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-sm bg-gray-50 p-4 rounded-lg">{selectedAccident.description}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Detection Details</h3>
            <p className="text-sm bg-gray-50 p-4 rounded-lg">
              Detected by: {selectedAccident.detectedBy}<br />
              Detection time: {new Date(selectedAccident.timestamp).toLocaleString()}
            </p>
          </div>
          
          {/* Action buttons */}
          {selectedAccident.status === "Pending" && (
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
                onClick={() => handleReject(selectedAccident.id)}
              >
                <X size={16} className="mr-2" />
                Reject
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                onClick={() => handleAccept(selectedAccident.id)}
              >
                <Check size={16} className="mr-2" />
                Accept
              </button>
            </div>
          )}
          
          {selectedAccident.status !== "Pending" && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-500">
                Status: <span className="font-medium">{selectedAccident.status}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render the settings view
  const renderSettingsView = () => (
    <div>
      <div className="flex items-center p-4 border-b border-gray-200 mb-6">
        <button 
          className="mr-3 p-2 rounded-full hover:bg-gray-100"
          onClick={() => setView('list')}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-medium text-gray-900">Alert Settings</h2>
      </div>
      
      <div className="p-6">
        {/* Severity Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <AlertTriangle size={16} className="mr-1" /> Severity Filters
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Select which severity levels you want to receive alerts for
          </p>
          
          <div className="space-y-2">
            {["Critical", "Major", "Moderate", "Minor"].map((severity) => (
              <label key={severity} className="flex items-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 text-blue-600 rounded"
                  checked={filters.severity.includes(severity)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({
                        ...filters,
                        severity: [...filters.severity, severity]
                      });
                    } else {
                      setFilters({
                        ...filters,
                        severity: filters.severity.filter(s => s !== severity)
                      });
                    }
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{severity}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Region Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <MapPin size={16} className="mr-1" /> Region Filters
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Select which regions you want to receive alerts from
          </p>
          
          <select 
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            value={filters.region}
            onChange={(e) => setFilters({...filters, region: e.target.value})}
          >
            <option value="All">All Regions</option>
            <option value="North">North District</option>
            <option value="South">South District</option>
            <option value="East">East District</option>
            <option value="West">West District</option>
            <option value="Central">Central District</option>
          </select>
        </div>
        
        {/* Notification Settings */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Bell size={16} className="mr-1" /> Notification Preferences
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Desktop notifications</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  style={{
                    right: "0",
                    transition: "all 0.3s",
                    backgroundColor: "white",
                    border: "2px solid #ddd",
                  }}
                />
                <label 
                  className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                  style={{
                    transition: "background-color 0.3s",
                  }}
                ></label>
              </div>
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Sound alerts</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  style={{
                    right: "0",
                    transition: "all 0.3s",
                    backgroundColor: "white",
                    border: "2px solid #ddd",
                  }}
                />
                <label 
                  className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                  style={{
                    transition: "background-color 0.3s",
                  }}
                ></label>
              </div>
            </label>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Email notifications</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  style={{
                    right: "0",
                    transition: "all 0.3s",
                    backgroundColor: "white",
                    border: "2px solid #ddd",
                  }}
                />
                <label 
                  className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                  style={{
                    transition: "background-color 0.3s",
                  }}
                ></label>
              </div>
            </label>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="mt-8">
          <button 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => setView('list')}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
  
  // Render the appropriate view
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {view === 'list' && renderListView()}
        {view === 'detail' && renderDetailView()}
        {view === 'settings' && renderSettingsView()}
      </div>
    </div>
  );
}