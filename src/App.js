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

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/signup" element={<SignUp/>}/>
                <Route path="/connections" element={<Connections/>}/>
                <Route path="/edit-profile" element={<EditProfile/>}/> {/* ✅ Add this */}
                <Route path="/reset-password" element={<ResetPassword/>}/>
                <Route path="/forgot-password" element={<ForgotPassword/>}/>
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
                <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
                <Route path="/messages" element={<ProtectedRoute><Messages/></ProtectedRoute>}/>
                <Route path="/settings" element={<ProtectedRoute><Settings/></ProtectedRoute>}/>
                <Route path="/search" element={<ProtectedRoute><Search/></ProtectedRoute>}/>
            </Routes>
        </Router>
    );
}

export default App;