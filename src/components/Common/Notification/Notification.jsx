import React, { useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { hideNotification } from '../../../store/slices/uiSlice';
import './Notification.css';

const Notification = () => {
  const notification = useSelector(state => state.ui.notification);
  const dispatch = useDispatch();

  useEffect(() => {
    if (notification && notification.show) {
      const timer = setTimeout(() => {
        dispatch(hideNotification());
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, dispatch]);

  if (!notification || !notification.show) return null;

  return (
    <ToastContainer position="top-end" className="p-3 notification-container">
      <Toast 
        show={notification.show} 
        onClose={() => dispatch(hideNotification())}
        bg={notification.type}
        delay={notification.duration}
        autohide
      >
        <Toast.Header>
          <strong className="me-auto">
            {notification.type === 'success' && '成功'}
            {notification.type === 'danger' && '错误'}
            {notification.type === 'warning' && '警告'}
            {notification.type === 'info' && '提示'}
          </strong>
        </Toast.Header>
        <Toast.Body className={notification.type === 'dark' ? 'text-white' : ''}>
          {notification.message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default Notification; 