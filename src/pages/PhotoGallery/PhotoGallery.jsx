import React, { useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Gallery from "../../components/Gallery/Gallery";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";

const PhotoGallery = () => {
  useEffect(() => {
    document.title = "图片库 | 塔斯马尼亚旅游";
    window.scroll(0, 0);
  }, []);

  return (
    <>
      <Breadcrumbs title="图片库" pagename="图片库" />
      <section className="py-5" style={{ overflow: "hidden" }}>
        <Container>
          <Row>
            <Col>
              <Gallery />
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default PhotoGallery;
