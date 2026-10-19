import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => (
  <main className="not-found-page">
    <Helmet>
      <title>Không tìm thấy trang | ChinHaStore</title>
      <meta name="description" content="Trang bạn đang tìm không tồn tại hoặc đã được di chuyển." />
    </Helmet>

    <section className="not-found-content" aria-labelledby="not-found-title">
      <img
        className="not-found-mascot"
        src="/assets/404%20not%20found.png"
        alt="Mascot ong thợ ảnh ChinHaStore đang tìm kiếm trang bị thất lạc"
      />
      <p className="not-found-code">404</p>
      <h1 id="not-found-title">Lạc mất một khoảnh khắc?</h1>
      <p className="not-found-message">
        Rất tiếc, trang bạn đang tìm không có ở đây. Cùng chú ong thợ ảnh quay về khám phá nhé!
      </p>
      <Link className="not-found-home-link" to="/">Về trang chủ</Link>
    </section>
  </main>
);

export default NotFoundPage;
