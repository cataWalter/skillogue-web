// App.js
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";
import Connections from "./pages/Connections";
import EditProfile from "./pages/EditProfile";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding"; // Import the new Onboarding component

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/signup" element={<SignUp/>}/>
                <Route path="/reset-password" element={<ResetPassword/>}/>
                <Route path="/forgot-password" element={<ForgotPassword/>}/>

                {/* Onboarding and Protected Routes */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding/></ProtectedRoute>}/>
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
                <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
                <Route path="/edit-profile" element={<ProtectedRoute><EditProfile/></ProtectedRoute>}/>
                <Route path="/messages" element={<ProtectedRoute><Messages/></ProtectedRoute>}/>
                <Route path="/settings" element={<ProtectedRoute><Settings/></ProtectedRoute>}/>
                <Route path="/search" element={<ProtectedRoute><Search/></ProtectedRoute>}/>
                <Route path="/connections" element={<ProtectedRoute><Connections/></ProtectedRoute>}/>
            </Routes>
        </Router>
    );
}

export default App;