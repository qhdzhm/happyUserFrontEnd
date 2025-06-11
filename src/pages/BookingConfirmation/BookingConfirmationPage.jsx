import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BookingDetails from '../../components/Booking/BookingDetails';
import { bookingService } from '../../services';
import { calculateTourDiscount, clearPriceCache } from '../../utils/api';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import { toast } from 'react-toastify';

const BookingConfirmationPage = () => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  // 重新验证价格
  const verifyPrice = async (booking) => {
    try {
      // 清除价格缓存，确保获取最新价格
      clearPriceCache();
      
      if (!booking || !booking.tour) return booking;
      
      // 获取必要信息
      const tourId = booking.tour.id;
      const tourType = booking.tour.type || 'day-tour';
      const originalPrice = booking.tour.originalPrice || booking.tour.price;
      const agentId = localStorage.getItem('agentId');
      const isAgent = localStorage.getItem('userType') === 'agent';
      
      // 如果不是代理商，无需验证折扣价格
      if (!isAgent || !agentId) return booking;
      
      console.log('下单前验证价格:', { tourId, tourType, originalPrice, agentId });
      
      // 调用API获取最新价格，强制跳过缓存
      const result = await calculateTourDiscount({
        tourId,
        tourType,
        originalPrice,
        agentId,
        skipCache: true // 重要：跳过缓存获取最新价格
      });
      
      // 检查价格是否发生变化
      if (booking.discountedPrice && 
          Math.abs(booking.discountedPrice - result.discountedPrice) > 0.01) {
        console.warn('价格有差异! 缓存价格:', booking.discountedPrice, 
                     '实际价格:', result.discountedPrice);
        
        // 提示用户价格已更新
        toast('价格信息已更新，请确认最新价格', {
          duration: 3000,
          style: {
            background: '#e3f2fd',
            color: '#1976d2',
            border: '1px solid #bbdefb'
          },
          icon: 'ℹ️',
        });
        
        // 更新价格
        return {
          ...booking,
          discountedPrice: result.discountedPrice,
          discountRate: result.discountRate,
          savedAmount: result.savedAmount
        };
      }
      
      return booking;
    } catch (error) {
      console.error('价格验证失败:', error);
      return booking; // 出错时返回原始订单
    }
  };
  
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getBookingById(bookingId);
        
        // 验证价格
        const verifiedBooking = await verifyPrice(data);
        
        setBooking(verifiedBooking);
        setError(null);
      } catch (err) {
        console.error('获取订单详情失败:', err);
        setError('获取订单详情失败');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleConfirm = async () => {
    try {
      // 再次验证价格
      const finalBooking = await verifyPrice(booking);
      setBooking(finalBooking);
      
      // 进入支付流程
      navigate(`/payment/${bookingId}`);
    } catch (err) {
      console.error('确认订单失败:', err);
      setError('确认订单失败');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!booking) {
    return <ErrorAlert message="未找到订单信息" />;
  }

  return (
    <div className="booking-confirmation-page">
      <h1>确认订单</h1>
      <BookingDetails booking={booking} />
      <div className="action-buttons">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate(-1)}
        >
          返回
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleConfirm}
        >
          确认支付
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmationPage; 