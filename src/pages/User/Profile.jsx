import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import UserProfile from './UserProfile';
import { Spinner } from 'react-bootstrap';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const userType = localStorage.getItem('userType');
  const isAgent = user?.role === 'agent' || userType === 'agent';
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Only run this effect once on mount
  useEffect(() => {
    // If user is an agent, redirect to the agent center
    if (isAgent && !isRedirecting) {
      console.log('Agent detected in Profile component, redirecting to agent-center');
      setIsRedirecting(true);
      
      // Use a small timeout to ensure the navigation happens after rendering
      const redirectTimer = setTimeout(() => {
        navigate('/agent-center', { replace: true });
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, []);  // Empty dependency array ensures this only runs once on mount

  // For agents who are being redirected, show a loading state
  if (isAgent) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">检测到您是代理商账户，正在为您跳转到代理商中心...</p>
        </div>
      </div>
    );
  }

  // For regular users, render the UserProfile component
  return <UserProfile />;
};

export default Profile; 