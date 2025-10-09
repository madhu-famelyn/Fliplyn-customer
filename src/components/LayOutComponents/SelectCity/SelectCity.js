// src/pages/SelectCity.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '../../LayOut/AdminLayout';
import { createCity } from './Service';
import { useAuth } from '../../AuthContex/AdminContext';
import './SelectCity.css';

const indianCities = {
  "Hyderabad": "00001",
  "Mumbai": "00002",
  "Delhi": "00003",
  "Bengaluru": "00004",
  "Chennai": "00005",
  "Kolkata": "00006",
  "Pune": "00007",
  "Ahmedabad": "00008",
  "Jaipur": "00009",
  "Surat": "00010",
  "Lucknow": "00011",
  "Kanpur": "00012",
  "Nagpur": "00013",
  "Visakhapatnam": "00014",
  "Bhopal": "00015",
  "Patna": "00016",
  "Vadodara": "00017",
  "Ghaziabad": "00018",
  "Ludhiana": "00019",
  "Agra": "00020",
  "Nashik": "00021",
  "Faridabad": "00022",
  "Meerut": "00023",
  "Rajkot": "00024",
  "Kalyan-Dombivli": "00025",
  "Vasai-Virar": "00026",
  "Varanasi": "00027",
  "Srinagar": "00028",
  "Aurangabad": "00029",
  "Dhanbad": "00030",
  "Amritsar": "00031",
  "Navi Mumbai": "00032",
  "Allahabad": "00033",
  "Ranchi": "00034",
  "Howrah": "00035",
  "Coimbatore": "00036",
  "Jabalpur": "00037",
  "Gwalior": "00038",
  "Vijayawada": "00039",
  "Jodhpur": "00040",
  "Madurai": "00041",
  "Raipur": "00042",
  "Kota": "00043",
  "Guwahati": "00044",
  "Chandigarh": "00045",
  "Solapur": "00046",
  "Hubli–Dharwad": "00047",
  "Tiruchirappalli": "00048",
  "Bareilly": "00049",
  "Moradabad": "00050"
};

export default function SelectCity() {
  const { state } = useLocation(); // expects: countryId, stateId, countryName, stateName
  const navigate = useNavigate();
  const { userId, token } = useAuth();

  const [cityName, setCityName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const city_id = indianCities[cityName];

    if (!cityName || !city_id || !state?.countryId || !state?.stateId || !userId) {
      setError('❌ Please select a valid city and ensure all data is provided.');
      return;
    }

    try {
      const response = await createCity({
        city: cityName,
        admin_id: userId,
        country_id: state.countryId,
        state_id: state.stateId
      }, token);

      const cityUUID = response?.id;
      if (!cityUUID) throw new Error('City ID (UUID) not returned from backend');

      navigate('/create-building', {
        state: {
          userId,
          countryId: state.countryId,
          stateId: state.stateId,
          cityId: cityUUID,
          cityName: cityName,
          cityIdentifier: response.city_id // ← 00005 or similar
        }
      });
    } catch (err) {
      console.error('❌ Error creating city:', err);
      setError('❌ City creation failed. Please try again.');
    }
  };

  return (
    <AdminLayout>
      <div className="select-city-container">
        <h2>Select a City from {state?.stateName}, {state?.countryName}</h2>

        {error && <p className="error-message">{error}</p>}

        <input
          list="city-options"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          className="city-input"
          placeholder="Type or search for a city"
        />
        <datalist id="city-options">
          {Object.keys(indianCities).map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>

        <button onClick={handleSubmit} className="submit-button" disabled={!cityName}>
          Submit
        </button>
      </div>
    </AdminLayout>
  );
}
