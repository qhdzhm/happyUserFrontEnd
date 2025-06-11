import React from 'react';
import { Badge, Card } from 'react-bootstrap';
import { FaUser, FaUserTie, FaUserCog, FaEye, FaEyeSlash, FaCreditCard } from 'react-icons/fa';
import { 
  getUserType, 
  getUserDisplayName, 
  canSeeDiscount, 
  canSeeCredit, 
  getAgentId, 
  getOperatorId,
  getDiscountRate 
} from '../../utils/auth';
import './UserInfo.css';

/**
 * 用户信息显示组件
 * @param {boolean} compact - 是否使用紧凑模式
 * @param {boolean} showPermissions - 是否显示权限信息
 */
const UserInfo = ({ compact = false, showPermissions = true }) => {
  const userType = getUserType();
  const displayName = getUserDisplayName();
  const canViewDiscount = canSeeDiscount();
  const canViewCredit = canSeeCredit();
  const agentId = getAgentId();
  const operatorId = getOperatorId();
  const discountRate = getDiscountRate();

  // 获取用户类型图标
  const getUserIcon = () => {
    switch (userType) {
      case 'agent':
        return <FaUserTie className="me-2" />;
      case 'agent_operator':
        return <FaUserCog className="me-2" />;
      case 'regular':
      default:
        return <FaUser className="me-2" />;
    }
  };

  // 获取用户类型颜色
  const getUserTypeVariant = () => {
    switch (userType) {
      case 'agent':
        return 'success';
      case 'agent_operator':
        return 'secondary';
      case 'regular':
      default:
        return 'primary';
    }
  };

  if (compact) {
    return (
      <div className="user-info-compact d-flex align-items-center">
        {getUserIcon()}
        <Badge bg={getUserTypeVariant()} className="me-2">
          {displayName}
        </Badge>
        {userType === 'agent_operator' && (
          <small className="text-muted">
            (代理商ID: {agentId})
          </small>
        )}
      </div>
    );
  }

  return (
    <Card className="user-info-card">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          {getUserIcon()}
          <div>
            <h6 className="mb-1">
              {displayName}
              <Badge bg={getUserTypeVariant()} className="ms-2">
                {userType === 'agent' ? '主账号' : userType === 'agent_operator' ? '操作员' : '普通用户'}
              </Badge>
            </h6>
            {agentId && (
              <small className="text-muted">代理商ID: {agentId}</small>
            )}
            {operatorId && (
              <small className="text-muted d-block">操作员ID: {operatorId}</small>
            )}
          </div>
        </div>

        {showPermissions && (userType === 'agent' || userType === 'agent_operator') && (
          <div className="permissions-info">
            <h6 className="mb-2">权限信息</h6>
            <div className="permission-item d-flex align-items-center mb-2">
              {canViewDiscount ? <FaEye className="text-success me-2" /> : <FaEyeSlash className="text-muted me-2" />}
              <span className={canViewDiscount ? 'text-success' : 'text-muted'}>
                查看折扣信息
              </span>
              {canViewDiscount && discountRate < 1 && (
                <Badge bg="info" className="ms-2">
                  {Math.round((1 - discountRate) * 100)}% 折扣
                </Badge>
              )}
            </div>
            <div className="permission-item d-flex align-items-center">
              {canViewCredit ? <FaCreditCard className="text-success me-2" /> : <FaCreditCard className="text-muted me-2" />}
              <span className={canViewCredit ? 'text-success' : 'text-muted'}>
                查看信用额度
              </span>
            </div>
            
            {userType === 'agent_operator' && (
              <div className="mt-3">
                <small className="text-info">
                  <strong>操作员说明：</strong><br />
                  • 您看到的是原价，但享受代理商折扣<br />
                  • 支付时将自动使用代理商信用额度<br />
                  • 无法查看具体的折扣率和信用余额
                </small>
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default UserInfo; 