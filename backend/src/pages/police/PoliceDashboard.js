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
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

const SeverityBadge = ({ severity }) => {
  const getColor = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor[severity.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
      {severity}
    </span>
  );
};

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/600x400?text=No+Image+Available";

const IncidentDetailModal = ({ incident, onClose }) => {
  const [zoomed, setZoomed] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!incident?.address) return;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            incident.address
          )}`
        );
        const data = await response.json();
        if (data?.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      } catch (error) {
        console.error("Failed to fetch coordinates:", error);
      }
    };
    fetchCoordinates();
  }, [incident]);

  if (!incident) return null;
  const imageUrl = incident.image?.startsWith("http")
    ? incident.image
    : `http://localhost:8000${incident.image}` || PLACEHOLDER_IMAGE;

  return (
    <>
       <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40">
  <div className="flex items-center justify-center min-h-screen px-4 py-8">
    <div className="bg-white w-full max-w-lg p-6 rounded-lg shadow-lg relative">

          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Accident Report #{incident.id}</h2>
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> {incident.address}
          </p>
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <Clock className="h-4 w-4 mr-1" /> {formatDate(incident.timestamp)}
          </p>
          <SeverityBadge severity={incident.severity} />
          <div className="relative mt-4 cursor-zoom-in" onClick={() => setZoomed(true)}>
            <img src={imageUrl} alt="Accident scene" className="w-full h-auto max-h-60 object-cover rounded shadow" />
            <ZoomIn className="absolute bottom-2 right-2 text-white bg-black bg-opacity-50 p-1 rounded" />
          </div>
          {incident.description && <p className="mt-4 text-sm text-gray-700">{incident.description}</p>}
          <p className="mt-4 text-sm text-gray-700">Status: <strong>{incident.status}</strong></p>
          {coords && (
            <div className="mt-4 h-64 rounded overflow-hidden">
              <MapContainer center={[coords.lat, coords.lng]} zoom={15} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[coords.lat, coords.lng]}>
                  <Popup>{incident.address}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
          </div>
        </div>
      </div>
      {zoomed && (
        <div className="fixed inset-0 z-60 bg-black bg-opacity-90 flex items-center justify-center" onClick={() => setZoomed(false)}>
          <img src={imageUrl} alt="Zoomed Accident" className="max-w-full max-h-full rounded shadow-2xl" />
        </div>
      )}
    </>
  );
};

const IncidentCard = ({ incident, onAccept, onReject, onViewDetails }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
    <div className="px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Accident Report #{incident.id}</h3>
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
          <video src={incident.image} className="w-full h-48 object-cover rounded" controls />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onAccept(incident.id)}
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Check className="mr-2 h-4 w-4" /> Accept
        </button>
        <button
          onClick={() => onReject(incident.id)}
          className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          <X className="mr-2 h-4 w-4" /> Reject
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

const EmptyState = () => (
  <div className="text-center py-16">
    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents</h3>
    <p className="mt-1 text-sm text-gray-500">There are no active incidents to display at this time.</p>
  </div>
);

const PoliceDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const User = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/api/accidents/assigned/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch incidents");
        const data = await res.json();
        setIncidents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const handleAccept = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/accidents/${id}/accept/`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) return;
      setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, status: "accepted" } : i));
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const handleReject = async (id) => {
  console.log("Rejecting incident:", id); // Debug

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8000/api/accidents/${id}/reject/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Failed to reject:", errorData);
      return;
    }

    console.log("Rejected successfully");
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "rejected" } : i))
    );
  } catch (err) {
    console.error("Error during rejection:", err);
  }
};



  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pending = incidents.filter((i) => i.status === "pending");
  const accepted = incidents.filter((i) => i.status === "accepted");
  const rejected = incidents.filter((i) => i.status === "rejected");



  if (loading) return <p className="text-center py-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link to="/" className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">SafeSight</span>
            </Link>
            <div className="flex items-center relative">
              <button onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="h-6 w-6 text-gray-600" />
              </button>
              {showNotifications && (
                <NotificationDropdown
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkAllRead={() => {
                    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                    setHasUnreadNotifications(false);
                  }}
                />
              )}
              <button onClick={() => setShowSettings(!showSettings)} className="ml-3">
                <Settings className="h-6 w-6 text-gray-600" />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-10 w-48 bg-white border rounded shadow-md">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
                </div>
              )}
              <div className="ml-3 text-sm font-medium text-gray-800">
                {User?.organization_name || "Police"}
              </div>
              <button onClick={logout} className="ml-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Police Dashboard</h1>
        <p className="text-gray-600">Welcome back, {User?.organization_name}</p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Pending Incidents</h2>
          {error && <p className="text-red-600">{error}</p>}
          {pending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {pending.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onViewDetails={setSelectedIncident}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Accepted Incidents</h2>
          {accepted.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {accepted.map((incident) => (
                <div key={incident.id} className="bg-white p-4 rounded shadow">
                  <h3 className="font-semibold text-gray-800">#{incident.id}</h3>
                  <p>{incident.address}</p>
                  <p>{formatDate(incident.timestamp)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mt-4">No accepted incidents</p>
          )}
        </section>
        <section className="mt-12">
  <h2 className="text-xl font-semibold">Rejected Incidents</h2>
  {rejected.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {rejected.map((incident) => (
        <div key={incident.id} className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-gray-800">#{incident.id}</h3>
          <p>{incident.address}</p>
          <p>{formatDate(incident.timestamp)}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-gray-500 mt-4">No rejected incidents</p>
  )}
</section>



        {selectedIncident && (
          <IncidentDetailModal incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
        )}
      </div>
    </div>
  );
};

export default PoliceDashboard;