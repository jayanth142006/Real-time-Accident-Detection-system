import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  AlertTriangle,
  Bell,
  Settings,
  MapPin,
  Clock,
  AlertCircle,
  Check,
  X,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { NotificationDropdown } from "../../components/NotificationDropdown";
// Helper function to format date
const formatDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Severity Badge Component
const SeverityBadge = ({ severity }) => {
  const getSeverityColor = (level) => {
    switch (level.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
        severity
      )}`}
    >
      {severity}
    </span>
  );
};

// Incident detail Modal
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/600x400?text=No+Image+Available";

const IncidentDetailModal = ({ incident, onClose }) => {
  const [zoomed, setZoomed] = useState(false);

  if (!incident) return null;

  const imageUrl = incident.image
    ? incident.image.startsWith("http")
      ? incident.image
      : `http://localhost:8000${incident.image}`
    : PLACEHOLDER_IMAGE;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg relative">

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Accident Report #{incident.id}
          </h2>

          {/* Address */}
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {incident.address}
          </p>

          {/* Timestamp */}
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {formatDate(incident.timestamp)}
          </p>

          {/* Severity */}
          <SeverityBadge severity={incident.severity} />

          {/* Image with Zoom Icon */}
          <div className="relative mt-4 cursor-zoom-in" onClick={() => setZoomed(true)}>
            <img
              src={imageUrl}
              alt="Accident scene"
              className="w-full h-auto max-h-60 object-cover rounded shadow"
            />
            <ZoomIn className="absolute bottom-2 right-2 text-white bg-black bg-opacity-50 p-1 rounded" />
          </div>

          {/* Description */}
          {incident.description && (
            <p className="mt-4 text-sm text-gray-700">{incident.description}</p>
          )}

          {/* Status */}
          <p className="mt-4 text-sm text-gray-700">
            Status: <strong>{incident.status}</strong>
          </p>
        </div>
      </div>

      {/* Zoomed Image Modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-60 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={() => setZoomed(false)}
        >
          <img
            src={imageUrl}
            alt="Zoomed Accident"
            className="max-w-full max-h-full rounded shadow-2xl"
          />
        </div>
      )}
    </>
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
          <p>{incident.address}</p>
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
          <button
            onClick={() => onReject(incident.id)}
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="mr-2 h-4 w-4" />
            Reject
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

const EmptyState = () => (
  <div className="text-center py-16">
    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents</h3>
    <p className="mt-1 text-sm text-gray-500">
      There are no active incidents to display at this time.
    </p>
  </div>
);

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading1, setLoading1] = useState(true);

  useEffect(() => {
    const fetchAccidents = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:8000/api/accidents/assigned/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch accidents");
        }

        const data = await response.json();
        setIncidents(data);
        setLoading1(false);
      } catch (error) {
        console.error("Error:", error);
        setError("Error fetching incidents");
        setLoading1(false);
      }
    };

    fetchAccidents();
  }, []);

  const handleAcceptIncident = (incidentId) => {
    const updatedIncidents = incidents.map((incident) =>
      incident.id === incidentId
        ? { ...incident, status: "accepted" }
        : incident
    );
    setIncidents(updatedIncidents);

    const incident = incidents.find((i) => i.id === incidentId);
    if (incident) {
      const newNotification = {
        id: Date.now(),
        title: "Incident Accepted",
        message: `You've accepted incident at ${incident.address}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        link: `/hospital/incident/${incidentId}`,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      setHasUnreadNotifications(true);
    }
  };

  const handleRejectIncident = (incidentId) => {
    setIncidents((prev) =>
      prev.filter((incident) => incident.id !== incidentId)
    );
    setNotifications((prev) =>
      prev.filter(
        (notification) =>
          !notification.link.includes(`/hospital/incident/${incidentId}`)
      )
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
    setHasUnreadNotifications(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (showNotifications || showSettings || showProfile) {
        setShowNotifications(false);
        setShowSettings(false);
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications, showSettings, showProfile]);

  const pendingIncidents = incidents.filter((i) => i.status === "pending");
  const acceptedIncidents = incidents.filter((i) => i.status === "accepted");
  const User = JSON.parse(localStorage.getItem("user"));
  console.log(incidents);
  const formatDate = (iso) => new Date(iso).toLocaleString();

  if (loading1) return <p className="text-center py-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  SafeSight
                </span>
              </Link>
            </div>

            <div className="flex items-center relative">
              {/* Notifications */}
              <button onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="h-6 w-6 text-gray-600" />
              </button>
              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                />
              )}

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="ml-3"
              >
                <Settings className="h-6 w-6 text-gray-600" />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-10 w-48 bg-white border rounded shadow-md">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* User Info */}
              <div className="ml-3 text-sm font-medium text-gray-800">
                {User?.organization_name || "Hospital"}
              </div>


              {/* Logout Button */}
              <button
                onClick={logout}
                className="ml-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors duration-200 shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Hospital Dashboard</h1>
        <p className="text-gray-600">Welcome back, {User?.organization_name}</p>

        {/* Pending Incidents */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Pending Incidents</h2>
          {error && <p className="text-red-600">{error}</p>}
          {pendingIncidents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {pendingIncidents.map((incident) => (
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
        </section>

        {/* Accepted Incidents */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Accepted Incidents</h2>
          {acceptedIncidents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {acceptedIncidents.map((incident) => (
                <div key={incident.id} className="bg-white p-4 rounded shadow">
                  <h3 className="font-semibold text-gray-800">
                    #{incident.id}
                  </h3>
                  <p>{incident.address}</p>
                  <p>{formatDate(incident.timestamp)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mt-4">No accepted incidents</p>
          )}
        </section>

        {selectedIncident && (
          <IncidentDetailModal
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
