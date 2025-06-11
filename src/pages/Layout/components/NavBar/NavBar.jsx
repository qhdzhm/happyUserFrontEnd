import React, { useState, useEffect } from 'react';
import { Button, Layout, Dropdown, Avatar, Menu, Badge, message } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearToken } from '../../../../redux/user/userSlice';
import './NavBar.scss';

// 模拟获取店铺状态的函数
const getShopStatus = async () => {
  return { code: 1, data: { status: 1 } };
};

// 模拟设置店铺状态的函数
const setShopStatus = async (status) => {
  return { code: 1, data: { status } };
};

const { Header } = Layout;

const NavBar = ({ collapsed, toggle }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [shopStatus, setShopStatusState] = useState(1);

  useEffect(() => {
    // 获取店铺状态
    const fetchShopStatus = async () => {
      try {
        const res = await getShopStatus();
        if (res.code === 1) {
          setShopStatusState(res.data.status);
        }
      } catch (error) {
        console.error('获取店铺状态失败:', error);
      }
    };

    fetchShopStatus();
  }, []);

  const handleShopStatusChange = async () => {
    try {
      const newStatus = shopStatus === 1 ? 0 : 1;
      const res = await setShopStatus(newStatus);
      if (res.code === 1) {
        setShopStatusState(newStatus);
        message.success(`已${newStatus === 1 ? '营业' : '打烊'}`);
      }
    } catch (error) {
      console.error('设置店铺状态失败:', error);
      message.error('设置店铺状态失败');
    }
  };

  const handleLogout = () => {
    dispatch(clearToken());
    navigate('/login');
  };

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<UserOutlined />}>
        个人中心
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="3" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="navbar">
      <div className="navbar-left">
        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
          className: 'trigger',
          onClick: toggle,
        })}
      </div>
      <div className="navbar-right">
        <Badge count={5} className="notification-badge">
          <BellOutlined className="notification-icon" />
        </Badge>
        <Button
          type={shopStatus === 1 ? 'primary' : 'default'}
          onClick={handleShopStatusChange}
          className="status-button"
        >
          {shopStatus === 1 ? '营业中' : '已打烊'}
        </Button>
        <Dropdown overlay={menu} trigger={['click']}>
          <div className="avatar-wrapper">
            <Avatar icon={<UserOutlined />} />
            <span className="username">管理员</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default NavBar; 