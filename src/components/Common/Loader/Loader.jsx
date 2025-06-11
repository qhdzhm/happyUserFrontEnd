import React from 'react';
import { Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import './Loader.css';

const Loader = () => {
  const isLoading = useSelector(state => state.ui.isLoading);

  if (!isLoading) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <Spinner animation="border" role="status" variant="primary" />
        <span className="loader-text">加载中...</span>
      </div>
    </div>
  );
};

export default Loader; 