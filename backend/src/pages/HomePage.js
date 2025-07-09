// HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Activity, Shield, Clock, Zap, HeartPulse, Siren } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, userRole, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">SafeSight</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link 
                    to={userRole === 'hospital' ? '/hospital/dashboard' : '/police/dashboard'} 
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors duration-200 shadow-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center relative z-10">
            <div className="mx-auto max-w-2xl">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6">
                <Zap className="h-4 w-4 mr-2" />
                Revolutionizing emergency response
              </div>
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">AI-Powered</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600">Emergency Detection</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                SafeSight transforms passive CCTV feeds into active emergency responders by detecting accidents in real-time and instantly alerting nearby hospitals and authorities.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  to="/signup" 
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-200"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all duration-200"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10"></div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How SafeSight Works
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
              Our AI-powered platform detects accidents and coordinates emergency responses in real-time.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gradient-to-b from-white to-blue-50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-blue-600 text-white shadow-md">
                  <Activity className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Real-time Detection</h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Our advanced AI continuously monitors CCTV feeds to detect road accidents as they occur with 98% accuracy.
                </p>
              </div>

              <div className="bg-gradient-to-b from-white to-blue-50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-blue-600 text-white shadow-md">
                  <Clock className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Immediate Alerts</h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Within seconds of detection, alerts with location and severity are sent to multiple nearby hospitals and police stations.
                </p>
              </div>

              <div className="bg-gradient-to-b from-white to-blue-50 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-blue-600 text-white shadow-md">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">Coordinated Response</h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Emergency teams receive crucial details instantly with optimized routes, enabling faster response times.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')]"></div>
        </div>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Saving Lives Through Technology
            </h2>
            <p className="mt-4 text-xl text-blue-200">
              Our platform is making a real difference in emergency response times.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:scale-105 transition-transform duration-300">
              <p className="text-5xl font-bold text-white">45%</p>
              <p className="mt-4 text-lg font-medium text-blue-100">Faster emergency response times</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:scale-105 transition-transform duration-300">
              <p className="text-5xl font-bold text-white">3x</p>
              <p className="mt-4 text-lg font-medium text-blue-100">More accurate accident detection</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:scale-105 transition-transform duration-300">
              <p className="text-5xl font-bold text-white">24/7</p>
              <p className="mt-4 text-lg font-medium text-blue-100">Continuous monitoring coverage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial/Use Case Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-inner">
                <div className="flex items-center">
                  <HeartPulse className="h-12 w-12 text-red-500" />
                  <Siren className="h-12 w-12 text-blue-600 ml-4" />
                </div>
                <blockquote className="mt-8">
                  <p className="text-xl font-medium text-gray-900">
                    "SafeSight reduced our emergency response time by 12 minutes on average - that's more lives we can save."
                  </p>
                  <footer className="mt-6">
                    <p className="text-base font-medium text-gray-600">Dr. Sarah Johnson</p>
                    <p className="text-base text-gray-500">Emergency Director, City General Hospital</p>
                  </footer>
                </blockquote>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-7">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Trusted by emergency services nationwide
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Hospitals and police departments across the country rely on SafeSight to provide critical early warnings for road accidents.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <HeartPulse className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Hospital Integration</h3>
                    <p className="mt-1 text-gray-600">Seamless connection with ER systems</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <Siren className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Police Dispatch</h3>
                    <p className="mt-1 text-gray-600">Direct alerts to patrol units</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to revolutionize</span>
            <span className="block text-blue-400">your emergency response?</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Get started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <span className="ml-2 text-xl font-bold text-white">SafeSight</span>
              </div>
              <p className="text-gray-400 text-base">
                Transforming emergency response through AI-powered accident detection.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">
                    Solutions
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <Link to="/hospitals" className="text-base text-gray-400 hover:text-white">
                        For Hospitals
                      </Link>
                    </li>
                    <li>
                      <Link to="/police" className="text-base text-gray-400 hover:text-white">
                        For Police
                      </Link>
                    </li>
                    <li>
                      <Link to="/cities" className="text-base text-gray-400 hover:text-white">
                        For Cities
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">
                    Company
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <Link to="/about" className="text-base text-gray-400 hover:text-white">
                        About
                      </Link>
                    </li>
                    <li>
                      <Link to="/blog" className="text-base text-gray-400 hover:text-white">
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link to="/careers" className="text-base text-gray-400 hover:text-white">
                        Careers
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">
                    Legal
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <Link to="/privacy" className="text-base text-gray-400 hover:text-white">
                        Privacy
                      </Link>
                    </li>
                    <li>
                      <Link to="/terms" className="text-base text-gray-400 hover:text-white">
                        Terms
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} SafeSight Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;