import React,{useEffect, useState} from "react";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import {
  Col,
  Container,
  Row,
  Card,
  ListGroup,
  Form,
  FloatingLabel,
  Button,
  Modal,
} from "react-bootstrap";
import image from "../../assets/images/new/contact-us.png";
import './Contact.css';

// 使用临时示例二维码
const wechatQrCodeUrl = "https://via.placeholder.com/200x200.png?text=WeChat+QR+Code";

// 主题色
const themeColor = "#ff6b6b";
const themeColorLight = "#ffe8e8";

const Contact = () => {
  const [showQrCode, setShowQrCode] = useState(false);
  
  const handleQrCodeShow = () => setShowQrCode(true);
  const handleQrCodeClose = () => setShowQrCode(false);

  useEffect(()=>{
    document.title ="联系我们 | 快乐旅行"
    window.scroll(0, 0)
  },[])

  return (
    <>
      <Breadcrumbs title="联系我们" pagename="联系我们" />
      <section className="contact pt-5">
        <Container>
          <Row>
            <Col md="12">
              <h1 className="mb-2 h1 font-bold">
                让我们建立联系，了解彼此
              </h1>
              <p className="body-text mt-1">
                无论您有任何问题、建议或需要帮助，我们的团队都随时准备为您提供支持。请通过以下方式与我们联系，我们将尽快回复您。
              </p>
            </Col>
          </Row>
          <Row className="py-5">
            <Col lg="4" md="6" className="mb-4 mb-lg-0">
              <Card className="border-0 shadow rounded-3 mb-4">
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-center align-item-search my-2">
                    <div style={{ backgroundColor: themeColorLight, color: themeColor }} className="rounded-circle shadow-sm p-3 mb-2">
                      <i className="bi bi-headset h3"></i>
                    </div>
                  </div>
                  <Card.Title className="fw-bold h5">电话咨询</Card.Title>
                  <p className="mb-3 body-text">
                    我们的客服团队随时为您提供专业的旅行咨询和预订服务，欢迎致电。
                  </p>
                  <div className="d-block justify-content-between">
                    <a type="button" className="btn btn-light me-2 btn-sm">
                      <i className="bi bi-phone me-1"></i>
                      400-123-4567
                    </a>
                    <a type="button" className="btn btn-light me-2 btn-sm">
                      <i className="bi bi-telephone me-1"></i>
                      021-87654321
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg="4" md="6" className="mb-4 mb-lg-0">
              <Card className="border-0 shadow rounded-3 mb-4">
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-center align-item-search my-2">
                    <div style={{ backgroundColor: themeColorLight, color: themeColor }} className="rounded-circle shadow-sm p-3 mb-2">
                      <i className="bi bi-envelope h3"></i>
                    </div>
                  </div>
                  <Card.Title className="fw-bold h5">邮件咨询</Card.Title>
                  <p className="mb-3 body-text">
                    如果您有详细的咨询需求或建议，欢迎发送邮件，我们会在24小时内回复您。
                  </p>
                  <div className="d-block justify-content-between">
                    <a type="button" className="btn btn-light me-2 btn-sm">
                      <i className="bi bi-envelope me-2"></i>
                      service@happytravel.com
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg="4" md="12" className="mb-4 mb-lg-0">
              <Card className="border-0 shadow rounded-3 mb-4 wechat-card" onClick={handleQrCodeShow}>
                <Card.Body className="text-center">
                  <div className="d-flex justify-content-center align-item-search my-2">
                    <div style={{ backgroundColor: themeColorLight, color: themeColor }} className="rounded-circle shadow-sm p-3 mb-2">
                      <i className="bi bi-wechat h3"></i>
                    </div>
                  </div>
                  <Card.Title className="fw-bold h5">微信公众号</Card.Title>
                  <p className="mb-3 body-text">
                    关注我们的微信公众号，获取最新的旅游资讯、优惠活动和精彩内容。
                  </p>
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="contact-hint">
                      <i className="bi bi-qr-code me-2"></i>
                      <span>点击查看二维码</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* 微信二维码弹窗 */}
          <Modal show={showQrCode} onHide={handleQrCodeClose} centered className="theme-modal">
            <Modal.Header closeButton style={{ borderBottom: 'none', backgroundColor: '#f8f8f8' }}>
              <Modal.Title style={{ color: themeColor, fontWeight: 'bold' }}>
                <i className="bi bi-wechat me-2"></i>
                扫码关注我们的微信公众号
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center py-4" style={{ backgroundColor: '#f8f8f8' }}>
              <div className="qr-code-container">
                <img src={wechatQrCodeUrl} alt="微信二维码" className="img-fluid qr-code-image" />
                <div className="qr-code-overlay">
                  <i className="bi bi-wechat" style={{ color: themeColor, opacity: 0.2, fontSize: '40px' }}></i>
                </div>
              </div>
              <div className="qr-code-info mt-4">
                <h5 className="mb-2" style={{ color: '#333' }}>Happy Tassie Travel</h5>
                <p className="mb-1">扫描二维码，关注我们的微信公众号</p>
                <p className="text-muted small">获取最新旅游资讯、专属优惠和精彩活动</p>
              </div>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: 'none', backgroundColor: '#f8f8f8', justifyContent: 'center' }}>
              <Button 
                onClick={handleQrCodeClose} 
                className="px-4 py-2" 
                style={{ backgroundColor: themeColor, borderColor: themeColor, borderRadius: '30px', fontWeight: 'bold' }}
              >
                <i className="bi bi-check-circle me-2"></i>
                我知道了
              </Button>
            </Modal.Footer>
          </Modal>

          <Row className="py-5 align-items-center">
            <Col xl="6" md="6" className="d-none d-md-block">
              <img src={image} alt="联系我们" className="img-fluid me-3" />
            </Col>
            <Col xl="6" md="6">
              <Card className="bg-light p-4 border-0 shadow-sm">
                <div className="form-box">
                  <h1 className="h3 font-bold mb-4">给我们留言</h1>
                  <Form>
                    <Row>
                      <Col md="6">
                        <FloatingLabel
                          controlId="name"
                          label="姓名"
                          className="mb-4"
                        >
                          <Form.Control type="text" placeholder="请输入您的姓名" />
                        </FloatingLabel>
                      </Col>
                      <Col md="6">
                        <FloatingLabel
                          controlId="email"
                          label="电子邮箱"
                          className="mb-4"
                        >
                          <Form.Control
                            type="email"
                            placeholder="name@example.com"
                          />
                        </FloatingLabel>
                      </Col>

                      <Col md="12">
                        <FloatingLabel
                          controlId="phone"
                          label="电话号码"
                          className="mb-4"
                        >
                          <Form.Control
                            type="text"
                            placeholder="请输入您的电话号码"
                          />
                        </FloatingLabel>
                      </Col>

                      <Col md="12">
                        <FloatingLabel controlId="message" label="留言内容">
                          <Form.Control
                            as="textarea"
                            placeholder="请输入您的留言内容"
                            style={{ height: "126px" }}
                          />
                        </FloatingLabel>
                      </Col>

                     
                    </Row>
                    <Button 
                      style={{ backgroundColor: themeColor, borderColor: themeColor }} 
                      className="mt-3" 
                      type="button"
                    >
                      发送留言
                    </Button>
                  </Form>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Contact;
