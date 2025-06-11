import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import './LoginPrompt.css';

const LoginPrompt = ({ message = '访问完整功能需要登录' }) => {
  const location = useLocation();
  
  return (
    <Alert variant="info" className="login-prompt">
      <Alert.Heading>需要登录</Alert.Heading>
      <p>{message}</p>
      <div className="d-flex justify-content-end">
        <Link to="/login" state={{ from: location.pathname }}>
          <Button variant="primary">登录</Button>
        </Link>
      </div>
    </Alert>
  );
};

export default LoginPrompt; 