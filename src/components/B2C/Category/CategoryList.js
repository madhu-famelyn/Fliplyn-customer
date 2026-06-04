import React from 'react';
import './CategoryList.css';

const S3_BASE_URL = 'https://fliplyn-assets.s3.ap-south-1.amazonaws.com/';

export default function B2CCategoryList({ categories, selectedCategoryId, onCategoryClick, isOpen, setIsOpen }) {

  const handleCategoryClick = (id) => {
    onCategoryClick(id);
    setIsOpen(false); // close sidebar after selecting 
  };

  return (
    <div className="category-sidebar-wrapper">

      {/* Sidebar */}
      <div className={`category-sidebar ${isOpen ? 'open' : 'closed'}`}>

        {/* Categories Loop */}
        {categories.map((cat) => {
          const imageUrl = cat.image_url?.startsWith('http')
            ? cat.image_url
            : `${S3_BASE_URL}${cat.image_url}`;

          return (
            <div
              key={cat.id}
              className={`category-item ${selectedCategoryId === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.id === "ALL" ? (
                <div className="all-items-icon-fallback">{cat.icon}</div>
              ) : (
                <img
                  src={imageUrl}
                  alt={cat.name}
                  className="category-icon"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/fallback-category.png";
                  }}
                />
              )}
              <span className="category-name">{cat.name}</span>
            </div>
          );
        })}
      </div>

      {/* Overlay */}
      {isOpen && <div className="category-overlay" onClick={() => setIsOpen(false)} />}

      {/* Toggle Button */}
      <button
        className={`toggle-sidebar-btn ${isOpen ? 'open' : 'closed'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="arrow-icon" />
      </button>
    </div>
  );
}
