import React, { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import GalleryImg1 from "../../assets/images/gallery/g1.jpg"
import GalleryImg3 from "../../assets/images/gallery/g3.jpg"
import GalleryImg4 from "../../assets/images/gallery/g4.jpg"
import GalleryImg6 from "../../assets/images/gallery/g6.jpg"
import GalleryImg7 from "../../assets/images/gallery/g7.jpg"
import { Row, Col, Card } from 'react-bootstrap'
import './Gallery.css'

const Gallery = () => {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);

    const images = [
        {
            src: GalleryImg1,
            alt: "Person wearing shoes",
            title: "Gift Habeshaw"
        },
        {
            src: GalleryImg3,
            alt: "Blonde woman wearing sunglasses smiling at the camera",
            title: "Dmitriy Frantsev"
        },
        {
            src: GalleryImg6,
            alt: "Gallery image",
            title: "Harry Cunningham"
        },
        {
            src: GalleryImg4,
            alt: "Jaipur, Rajasthan India",
            title: "Liam Baldock"
        },
        {
            src: GalleryImg7,
            alt: "Gallery image",
            title: "Verne Ho"
        },
        {
            src: GalleryImg6,
            alt: "Rann of kutch, India",
            title: "Hari Nandakumar"
        },
    ];

    const openLightbox = (index) => {
        setIndex(index);
        setOpen(true);
    };

    return (
        <>
            <Row className="g-3">
                {images.map((image, idx) => (
                    <Col key={idx} xs={6} md={4}>
                        <Card className="gallery-card" onClick={() => openLightbox(idx)}>
                            <Card.Img variant="top" src={image.src} alt={image.alt} />
                            <Card.Body className="p-2">
                                <Card.Title className="fs-6">{image.title}</Card.Title>
                                {image.alt && <Card.Text className="small text-muted">{image.alt}</Card.Text>}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
            
            <Lightbox
                open={open}
                close={() => setOpen(false)}
                index={index}
                slides={images}
            />
        </>
    );
}

export default Gallery