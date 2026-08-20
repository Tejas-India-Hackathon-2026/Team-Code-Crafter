import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { LocationProvider, useLocation } from './context/LocationContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CustomerDashboard from './pages/CustomerDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerProfilePage from './pages/WorkerProfilePage';
import AdminDashboard from './pages/AdminDashboard';

import WorkerDetailModal from './components/WorkerDetailModal';
import BookingModal from './components/BookingModal';
import ReviewModal from './components/ReviewModal';
import MapViewModal from './components/MapViewModal';
import EmailLogViewer from './components/EmailLogViewer';
import NotificationDrawer from './components/NotificationDrawer';
import BookingChatModal from './components/BookingChatModal';
import {
  LoginModal,
  RegisterCustomerModal,
  RegisterWorkerModal,
  ForgotPasswordModal,
  DemoRoleSwitcherModal
} from './components/AuthModals';

function MainApp() {
  const { user, role, isAuthenticated, isPendingWorker } = useAuth();
  const { coords, currentLocation } = useLocation();

  // Navigation State
  const [activePage, setActivePage] = useState('home'); // 'home', 'customer-dashboard', 'worker-dashboard', 'worker-profile', 'admin'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterCustomerOpen, setIsRegisterCustomerOpen] = useState(false);
  const [isRegisterWorkerOpen, setIsRegisterWorkerOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isDemoSwitcherOpen, setIsDemoSwitcherOpen] = useState(false);
  const [isEmailLogsOpen, setIsEmailLogsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState(null);
  const [bookingWorker, setBookingWorker] = useState(null);
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const [mapWorkers, setMapWorkers] = useState(null);

  // Auto-redirect if role changes
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin' && activePage === 'home') {
        // Keep home or allow admin to browse
      }
    }
  }, [isAuthenticated, role]);

  const handleBookNow = (worker) => {
    setBookingWorker(worker);
  };

  const handleViewProfile = (worker) => {
    setSelectedWorkerDetail(worker);
  };

  const handleRebook = async (workerId) => {
    try {
      const res = await fetch(`/api/workers/${workerId}`);
      const data = await res.json();
      if (data.success && data.worker) {
        setBookingWorker(data.worker);
      }
    } catch (err) {
      console.error('Failed to rebook:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Navigation */}
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegisterCustomer={() => setIsRegisterCustomerOpen(true)}
        onOpenRegisterWorker={() => setIsRegisterWorkerOpen(true)}
        onOpenEmailLogs={() => setIsEmailLogsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenDemoSwitcher={() => setIsDemoSwitcherOpen(true)}
        onNavigate={setActivePage}
        activePage={activePage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Pages */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            onViewProfile={handleViewProfile}
            onBookNow={handleBookNow}
            onOpenRegisterWorker={() => setIsRegisterWorkerOpen(true)}
            onOpenMapView={(workers) => setMapWorkers(workers)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activePage === 'customer-dashboard' && (
          <CustomerDashboard
            onOpenReviewModal={(b) => setReviewingBooking(b)}
            onRebookWorker={handleRebook}
            onOpenChat={(b) => setChatBooking(b)}
          />
        )}

        {activePage === 'worker-dashboard' && (
          <WorkerDashboard onNavigate={setActivePage} onOpenChat={(b) => setChatBooking(b)} />
        )}

        {activePage === 'worker-profile' && (
          <WorkerProfilePage />
        )}

        {activePage === 'admin' && (
          <AdminDashboard onOpenEmailLogs={() => setIsEmailLogsOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setActivePage('home');
          setSearchQuery(cat);
          window.scrollTo({ top: 450, behavior: 'smooth' });
        }}
        onOpenRegisterWorker={() => setIsRegisterWorkerOpen(true)}
      />

      {/* Modals & Dialogs */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenRegisterCustomer={() => setIsRegisterCustomerOpen(true)}
        onOpenRegisterWorker={() => setIsRegisterWorkerOpen(true)}
        onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
      />

      <RegisterCustomerModal
        isOpen={isRegisterCustomerOpen}
        onClose={() => setIsRegisterCustomerOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <RegisterWorkerModal
        isOpen={isRegisterWorkerOpen}
        onClose={() => setIsRegisterWorkerOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <DemoRoleSwitcherModal
        isOpen={isDemoSwitcherOpen}
        onClose={() => setIsDemoSwitcherOpen(false)}
      />

      {selectedWorkerDetail && (
        <WorkerDetailModal
          worker={selectedWorkerDetail}
          onClose={() => setSelectedWorkerDetail(null)}
          onBookNow={(w) => {
            setSelectedWorkerDetail(null);
            setBookingWorker(w);
          }}
        />
      )}

      {bookingWorker && (
        <BookingModal
          worker={bookingWorker}
          onClose={() => setBookingWorker(null)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onSuccess={() => {
            // Keep modal message until user closes, then can navigate
          }}
        />
      )}

      {reviewingBooking && (
        <ReviewModal
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onSuccess={() => {
            // Updated review
          }}
        />
      )}

      {chatBooking && <BookingChatModal booking={chatBooking} onClose={() => setChatBooking(null)} />}

      {mapWorkers && (
        <MapViewModal
          workers={mapWorkers}
          userCoords={coords}
          userLocationName={currentLocation}
          onClose={() => setMapWorkers(null)}
          onSelectWorker={(w) => {
            setMapWorkers(null);
            setSelectedWorkerDetail(w);
          }}
          onBookNow={(w) => {
            setMapWorkers(null);
            setBookingWorker(w);
          }}
        />
      )}

      {isEmailLogsOpen && (
        <EmailLogViewer onClose={() => setIsEmailLogsOpen(false)} />
      )}

      {isNotificationsOpen && (
        <NotificationDrawer
          onClose={() => setIsNotificationsOpen(false)}
          onNavigate={setActivePage}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <LocationProvider>
          <MainApp />
        </LocationProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
