import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loading = () => {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <Spinner animation="border" variant="primary" role="status">
        <span className="visually-hidden">加载中...</span>
      </Spinner>
    </div>
  );
};

export default Loading; 