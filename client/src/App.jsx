import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/login/Login";
import Register from "./components/register/Register";
import "./App.css";
import PrivacyPolicy from "./components/privacypolicy/PrivacyPolicy";
import NavbarLayout from "./components/nested routing/NavbarLayout";
import AboutUs from "./components/about us/AboutUs";
import AllAttendence from "./pages/adminDashboard/attendence/AllAttendence";
import Feedback from "./components/feedback/Feedback";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { LoadingBarProvider } from "./context/LoadingBarContext";
import { Schedule } from "./context/Schedule";
import StudentDashboard from "./pages/studentDashboard/StudentDashboard";
import AdminDashboard from "./pages/adminDashboard/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentAttendence from "./pages/studentDashboard/attendence/StudentAttendence";
import AttendanceMarking from "./pages/studentDashboard/attendence/AttendanceMarking";
import Classes from "./pages/studentDashboard/classes/Classes";
import Students from "./pages/adminDashboard/students/Students";
import TokenManagement from "./pages/adminDashboard/tokens/TokenManagement";
import Profile from "./components/profile/Profile";
import Chatbot from "./components/chatbot/Chatbot";
import CompleteProfile from "./components/CompleteProfile/CompleteProfile";

function App() {
  return (
    <ThemeProvider>
      <LoadingBarProvider>
        <ToastProvider>
          <AuthProvider>
            <Schedule>
              <Router>
                <div className='app-root-container'>
                <Routes>
                  <Route path='/' element={<Login />} />
                  <Route path='/signin' element={<Login />} />
                  <Route path='/signup' element={<Register />} />
                  <Route path='/complete-profile' element={<CompleteProfile />} />

                  {/* Student Portal Routes */}
                  <Route
                    path='/student'
                    element={
                      <ProtectedRoute role='student'>
                        <NavbarLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<StudentDashboard />} />
                    <Route path='attendence' element={<StudentAttendence />} />
                    <Route path='mark-attendance' element={<AttendanceMarking />} />
                    <Route path='classes' element={<Classes />} />
                    <Route path='privacypolicy' element={<PrivacyPolicy />} />
                    <Route path='aboutus' element={<AboutUs />} />
                    <Route path='feedback' element={<Feedback />} />
                    <Route path='profile' element={<Profile />} />
                  </Route>

                  {/* Staff / Faculty Portal Routes */}
                  <Route
                    path='/staff'
                    element={
                      <ProtectedRoute role='staff'>
                        <NavbarLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path='manage-tokens' element={<TokenManagement />} />
                    <Route path='tokens' element={<TokenManagement />} />
                    <Route path='students' element={<Students />} />
                    <Route path='attendence' element={<AllAttendence />} />
                    <Route path='privacypolicy' element={<PrivacyPolicy />} />
                    <Route path='aboutus' element={<AboutUs />} />
                    <Route path='feedback' element={<Feedback />} />
                    <Route path='profile' element={<Profile />} />
                  </Route>

                  <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
                <Chatbot />
              </div>
            </Router>
          </Schedule>
        </AuthProvider>
        </ToastProvider>
      </LoadingBarProvider>
    </ThemeProvider>
  );
}

export default App;
