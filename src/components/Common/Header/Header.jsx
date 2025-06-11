import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Navbar,
  Offcanvas,
  Nav,
  NavDropdown,
  Dropdown,
  Button,
  Badge
} from "react-bootstrap";
import { NavLink, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../../store/slices/authSlice";
import "./header.css";

import logo from "../../../assets/images/logo/logo.png";
import { FaUser, FaSignInAlt, FaUserTie, FaPercent } from "react-icons/fa";

// 格式化折扣率为百分比
const formatDiscountRate = (rate) => {
  // 确保rate是数字
  let numRate = Number(rate);
  if (isNaN(numRate) || numRate <= 0) {
    return "";
  }
  
  // 如果折扣率大于1，它可能已经是百分比格式
  if (numRate > 1) {
    return `${Math.round(numRate)}%`;
  }
  
  // 将折扣率转换为百分比
  return `${Math.round(numRate * 100)}%`;
};

const Header = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { discountRate } = useSelector(state => state.ui);
  const dispatch = useDispatch();

  // 从用户信息或本地存储中获取用户角色，确保正确识别代理商
  const userType = user?.userType || user?.role || localStorage.getItem('userType') || 'regular';
  const isAgent = userType === 'agent' || userType === 'agent_operator';
  const isOperator = userType === 'agent_operator'; // 判断是否为操作员
  
  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (user?.username) return user.username;
    if (user?.name) return user.name;
    if (user?.companyName) return user.companyName;
    
    // 从localStorage获取
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) return storedUsername;
    
    // 根据用户类型返回默认名称
    if (userType === 'agent_operator') return '操作员';
    if (userType === 'agent') return '代理商';
    return '用户';
  };
  
  // 获取有效的折扣率 - 操作员不显示折扣信息
  const effectiveDiscountRate = !isOperator ? (user?.discountRate || discountRate || localStorage.getItem('discountRate')) : null;
  const formattedDiscountRate = !isOperator ? formatDiscountRate(effectiveDiscountRate) : null;

  const toggleMenu = () => {
    setOpen(!open);
  };

  useEffect(()=>{
    window.addEventListener("scroll", isSticky);
    return ()=>{
      window.removeEventListener("scroll", isSticky)
    }
  })

  // sticky Header 
  const isSticky=(e)=>{
    const header = document.querySelector('.header-section');
    const scrollTop = window.scrollY;
    scrollTop >= 120 ? header.classList.add('is-sticky') :
    header.classList.remove('is-sticky')
  }

  const closeMenu =()=>{
    if(window.innerWidth <= 991){
      setOpen(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout());
  };
 
  return (
    <>
      {/* 主导航栏 */}
      <header className="header-section">
        <Container>
          <Navbar expand="lg" className="p-0">
            {/* Logo Section  */}
            <Navbar.Brand>
              <NavLink to="/" className="logo-link">
                <div className="logo-container">
                  <img 
                    src={logo} 
                    alt="Happy Tassie Holiday" 
                    className="brand-logo"
                  />
                </div>
              </NavLink>
            </Navbar.Brand>
            {/* End Logo Section  */}

            <Navbar.Offcanvas
              id={`offcanvasNavbar-expand-lg`}
              aria-labelledby={`offcanvasNavbarLabel-expand-lg`}
              placement="start"
              show={open}
            >
              {/*mobile Logo Section  */}
              <Offcanvas.Header>
                <div className="logo">
                  <div className="logo-container-mobile">
                    <img 
                      src={logo}
                      alt="Happy Tassie Holiday" 
                      className="mobile-logo"
                    />
                  </div>
                </div>
                <span className="navbar-toggler ms-auto"  onClick={toggleMenu}>
                  <i className="bi bi-x-lg"></i>
                </span>
              </Offcanvas.Header>
              {/*end mobile Logo Section  */}

              <Offcanvas.Body>
                <Nav className="justify-content-end flex-grow-1 pe-3">
                  <NavLink className="nav-link" to="/" onClick={closeMenu}>
                    首页
                  </NavLink>
                  <NavLink className="nav-link" to="/about-us" onClick={closeMenu}>
                    关于我们
                  </NavLink>
                  <NavLink className="nav-link" to="/tours" onClick={closeMenu}>
                    旅游路线
                  </NavLink>

                  <NavDropdown
                    title="旅游区域"
                    id={`offcanvasNavbarDropdown-expand-lg`}
                  >
                    <NavLink className="dropdown-item" to="/destinations" onClick={closeMenu}>
                      塔斯马尼亚区域
                    </NavLink>
                  </NavDropdown>
                  <NavLink className="nav-link" to="/gallery" onClick={closeMenu}>
                    图片库
                  </NavLink>
                  <NavLink className="nav-link" to="/contact-us" onClick={closeMenu}>
                    联系我们
                  </NavLink>
                  
                  {/* 移动端显示的登录/用户信息 */}
                  {!isAuthenticated ? (
                    <>
                      <NavLink className="booking-btn d-block d-sm-none mt-3" to="/booking-form" onClick={closeMenu}>
                        立即预订
                      </NavLink>
                      <NavLink className="login-btn d-block d-sm-none mt-2" to="/login" onClick={closeMenu}>
                        <FaSignInAlt className="me-1" /> 登录
                      </NavLink>
                    </>
                  ) : (
                    <>
                      <NavLink className="booking-btn d-block d-sm-none mt-3" to="/booking-form" onClick={closeMenu}>
                        立即预订
                      </NavLink>
                      <div className="user-info d-block d-sm-none mt-2">
                        <Dropdown>
                          <Dropdown.Toggle variant="link" id="dropdown-user-mobile" className="user-dropdown d-flex align-items-center">
                            {isAgent ? (
                              <FaUserTie className="me-1" />
                            ) : (
                              <FaUser className="me-1" />
                            )}
                            {getUserDisplayName()}
                            {isAgent && !isOperator && formattedDiscountRate && (
                              <span className="ms-1 discount-badge-mobile">{formattedDiscountRate}折</span>
                            )}
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            {!isAgent && (
                              <Dropdown.Item as={Link} to="/profile">个人中心</Dropdown.Item>
                            )}
                            <Dropdown.Item as={Link} to="/orders">我的订单</Dropdown.Item>
                            {isAgent && (
                              <>
                                <Dropdown.Item as={Link} to="/profile">代理商中心</Dropdown.Item>
                                <Dropdown.Item as={Link} to="/test-operator">操作员测试</Dropdown.Item>
                              </>
                            )}
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout}>退出登录</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </>
                  )}
                </Nav>
              </Offcanvas.Body>
            </Navbar.Offcanvas>
            
            {/* 桌面端显示的登录/用户信息 */}
            <div className="ms-md-4 ms-2 d-flex align-items-center">
              {!isAuthenticated ? (
                <>
                  <NavLink to="/booking-form" className="booking-btn d-none d-sm-inline-block me-3">
                    立即预订
                  </NavLink>
                  <NavLink to="/login" className="login-btn d-none d-sm-inline-block">
                    <FaSignInAlt className="me-1" /> 登录
                  </NavLink>
                </>
              ) : (
                <div className="d-flex align-items-center">
                  <NavLink to="/booking-form" className="booking-btn d-none d-sm-inline-block me-3">
                    立即预订
                  </NavLink>
                  <Dropdown>
                    <Dropdown.Toggle variant="link" id="dropdown-user" className="user-dropdown">
                      {isAgent ? (
                        <>
                          <FaUserTie className="me-1" /> 
                          <span className="user-name agent">
                            {getUserDisplayName()}
                            {!isOperator && formattedDiscountRate && (
                              <Badge bg="info" className="ms-2 discount-badge">
                                <FaPercent className="me-1" size="0.8em" />
                                {formattedDiscountRate}折
                              </Badge>
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <FaUser className="me-1" />
                          <span className="user-name">{getUserDisplayName()}</span>
                        </>
                      )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {!isAgent && (
                        <Dropdown.Item as={Link} to="/profile">个人中心</Dropdown.Item>
                      )}
                      <Dropdown.Item as={Link} to="/orders">我的订单</Dropdown.Item>
                      {isAgent && (
                        <>
                          <Dropdown.Item as={Link} to="/profile">代理商中心</Dropdown.Item>
                          <Dropdown.Item as={Link} to="/test-operator">操作员测试</Dropdown.Item>
                        </>
                      )}
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout}>退出登录</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              )}
              <li className="d-inline-block d-lg-none ms-3 toggle_btn">
                <i className={open ? "bi bi-x-lg" : "bi bi-list"}  onClick={toggleMenu}></i>
              </li>
            </div>
          </Navbar>
        </Container>
      </header>
    </>
  );
};

export default Header;
