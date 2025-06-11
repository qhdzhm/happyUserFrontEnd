import React from 'react';
import { Badge } from 'react-bootstrap';
import { FaHotel, FaBed, FaTicketAlt } from 'react-icons/fa';
import { canSeeDiscount, isOperator, isAgent } from '../utils/auth';
import './PriceDisplay.css';

/**
 * 价格显示组件
 * @param {Number} originalPrice - 非代理价格/原始价格
 * @param {Number} discountedPrice - 当前价格或折扣价格
 * @param {Number} actualPaymentPrice - 实际支付价格（操作员专用）
 * @param {Boolean} showBadge - 是否显示折扣标签 (默认: false)
 * @param {Boolean} showDiscount - 是否显示折扣信息（从后端返回）
 * @param {String} currency - 货币符号 (默认: "$")
 * @param {String} size - 尺寸 "small", "medium", "large" (默认: "medium")
 * @param {Number} hotelPriceDifference - 每晚酒店价格差异 (可选)
 * @param {Number} hotelNights - 酒店晚数 (可选)
 * @param {String} baseHotelLevel - 基准酒店等级 (可选，默认: "4星")
 * @param {Number} dailySingleRoomSupplement - 每晚单房差 (可选)
 * @param {Number} roomCount - 房间数量 (可选)
 * @param {Number} extraRoomFee - 额外房间费用 (可选)
 * @param {Boolean} isAgent - 是否为代理商 (默认: false)
 * @returns {JSX.Element}
 */
const PriceDisplay = ({ 
  originalPrice, 
  discountedPrice,
  actualPaymentPrice,
  showBadge = false,
  showDiscount,
  currency = "$", 
  size = "medium",
  hotelPriceDifference,
  hotelNights,
  baseHotelLevel = "4星",
  dailySingleRoomSupplement,
  roomCount = 1,
  extraRoomFee = 0,
  isAgent: isAgentProp = false
}) => {
  // 确保有价格可显示
  if (!originalPrice && !discountedPrice) return null;
  
  // 获取用户权限信息
  const userCanSeeDiscount = canSeeDiscount();
  const userIsOperator = isOperator();
  const userIsAgent = isAgent();
  
  // 确定是否显示折扣价
  // 1. 如果后端明确指定了showDiscount，使用后端的设置
  // 2. 否则根据用户权限和价格差异判断
  let shouldShowDiscount = false;
  if (showDiscount !== undefined) {
    shouldShowDiscount = showDiscount && userCanSeeDiscount;
  } else {
    // 传统逻辑：对于代理商，我们总是显示两个价格，即使它们相同
    shouldShowDiscount = (isAgentProp || userIsAgent) && userCanSeeDiscount ? 
      !!originalPrice : 
      (originalPrice && discountedPrice && originalPrice !== discountedPrice);
  }
  
  // 计算折扣率
  const discountRate = shouldShowDiscount && originalPrice && discountedPrice ? 
    Math.round((1 - discountedPrice / originalPrice) * 100) : 0;
  
  // 确定尺寸类
  const sizeClass = size === "small" ? "price-display-sm" : 
                    size === "large" ? "price-display-lg" : 
                    "price-display-md";
  
  // 确定显示价格
  let displayPrice;
  if (userIsOperator && originalPrice) {
    // 操作员显示原价
    displayPrice = originalPrice;
  } else {
    // 代理商主账号和普通用户显示折扣价或原价
    displayPrice = discountedPrice || originalPrice;
  }
  
  return (
    <div className={`price-display ${sizeClass}`}>
      {/* 显示原价 - 仅在有折扣且用户有权限查看时显示 */}
      {shouldShowDiscount && !userIsOperator && (
        <div className="original-price text-muted">
          <s>{currency}{originalPrice.toFixed(2)}</s>
        </div>
      )}
      
      {/* 显示现价 */}
      <div className="current-price">
        <span className="price-value">
          {currency}{displayPrice.toFixed(2)}
        </span>
        
        {/* 显示折扣标签 - 仅在有折扣且用户有权限查看时显示 */}
        {showBadge && discountRate > 0 && userCanSeeDiscount && !userIsOperator && (
          <Badge bg="danger" className="ms-2 discount-badge">
            {discountRate}% OFF
          </Badge>
        )}
        

      </div>
      
      {/* 显示额外房间费用 */}
      {extraRoomFee !== undefined && extraRoomFee > 0 && (
        <div className="hotel-diff-info mt-1 small text-success">
          <FaHotel className="me-1" /> 
          房间差价: {currency}{extraRoomFee.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;