import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../AuthContex/ContextAPI";
import { useNavigate } from "react-router-dom";
import "./Category.css";

export default function ManagerCategory() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [stalls, setStalls] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [selectedStall, setSelectedStall] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch stalls for manager's building
  useEffect(() => {
    if (user?.building_id && token) {
      axios
        .get(`http://localhost:8000/stalls/building/${user.building_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setStalls(res.data);
        })
        .catch((err) => {
          console.error("Error fetching stalls:", err);
          setErrorMsg("Failed to fetch stalls");
        });
    }
  }, [user, token]);

  // Handle file change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (!categoryName || !selectedStall) {
      setErrorMsg("Please fill all required fields");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", categoryName);
    formData.append("building_id", user.building_id);
    formData.append("stall_id", selectedStall);
    formData.append("admin_id", user.admin_id);
    formData.append("manager_id", user.id);
    if (file) {
      formData.append("file", file);
    }

    try {
      const res = await axios.post("http://localhost:8000/categories/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.status === 200) {
        setSuccessMsg("Category created successfully!");
        setCategoryName("");
        setSelectedStall("");
        setFile(null);

        // Navigate to manager-stalls after a short delay
        setTimeout(() => {
          navigate("/manager-stalls");
        }, 800);
      }
    } catch (err) {
      console.error("Error creating category:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-container">
      <h2>Create New Category</h2>
      <form onSubmit={handleSubmit} className="category-form">
        <div className="form-group">
          <label>Category Name *</label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Enter category name"
          />
        </div>

        <div className="form-group">
          <label>Select Stall *</label>
          <select
            value={selectedStall}
            onChange={(e) => setSelectedStall(e.target.value)}
          >
            <option value="">-- Select Stall --</option>
            {stalls.map((stall) => (
              <option key={stall.id} value={stall.id}>
                {stall.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Category Image (optional)</label>
          <input type="file" onChange={handleFileChange} accept="image/*" />
        </div>

        {loading ? (
          <button type="submit" disabled>
            Creating...
          </button>
        ) : (
          <button type="submit">Create Category</button>
        )}

        {successMsg && <p className="success-msg">{successMsg}</p>}
        {errorMsg && <p className="error-msg">{errorMsg}</p>}
      </form>
    </div>
  );
}
