import React, { useState } from 'react';
import LoginPage from './components/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';

interface UserData {
  role: 'admin' | 'agent';
  name: string;
  email: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleLogin = (userData: UserData) => {
    setUserData(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUserData(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn || !userData) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AdminLayout
      onLogout={handleLogout}
      userRole={userData.role}
      userName={userData.name}
      userEmail={userData.email}
    />
  );
}

export default App;