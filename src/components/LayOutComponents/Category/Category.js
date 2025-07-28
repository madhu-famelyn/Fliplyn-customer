import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../LayOut/AdminLayout';
import './Category.css';
import { createCategory, fetchCategoriesByStall } from './Service';

export default function AddCategory() {
  const { stallId } = useParams();
  const location = useLocation();
  const { buildingId, adminId } = location.state || {};
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (stallId) {
      fetchCategoriesByStall(stallId)
        .then(setCategories)
        .catch((err) => {
          console.error('Failed to fetch categories:', err);
          setCategories([]);
        });
    }
  }, [stallId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !file || !buildingId || !stallId || !adminId) {
      alert('Please fill in all required fields and upload an image');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('building_id', buildingId);
    formData.append('stall_id', stallId);
    formData.append('admin_id', adminId);
    formData.append('file', file);

    try {
      setLoading(true);
      await createCategory(formData);
      alert('Category created successfully!');
      setName('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const refreshed = await fetchCategoriesByStall(stallId);
      setCategories(refreshed);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (categoryId) => {
    const localAdminId = localStorage.getItem('admin_id');

    navigate('/item', {
      state: {
        buildingId,
        stallId,
        categoryId,
        adminId: localAdminId,
      },
    });
  };

  return (
    <AdminLayout>
      <div className="category-form-container">
        <div className="category-header">
          <h1>Categories</h1>
          <button onClick={() => setShowForm(!showForm)} className="create-category-btn">
            {showForm ? 'Close Form' : 'Create Category'}
          </button>
        </div>

        {showForm && (
          <form className="category-form" onSubmit={handleSubmit}>
            <label>Category Name</label>
            <input
              type="text"
              placeholder="Enter category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label>Upload Image</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files[0])}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        )}

        <div className="category-list">
          <h2>Categories in this Stall</h2>
          {categories.length > 0 ? (
            <div className="category-cards">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="category-card"
                  onClick={() => handleCardClick(cat.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={`http://localhost:8000/${cat.image_url}`}
                    alt={cat.name}
                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                    onError={(e) => {
                      e.target.src = '/fallback.png';
                    }}
                  />
                  <h4>{cat.name}</h4>
                </div>
              ))}
            </div>
          ) : (
            <p>No categories available for this stall.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
