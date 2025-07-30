// src/pages/SelectCountry.js
import React from 'react';
import AdminLayout from '../../LayOut/AdminLayout';
import './SelectCountry.css';
import { useAuth } from '../../AuthContex/ContextAPI';
import { createCountrySelection } from './Service';
import { useNavigate } from 'react-router-dom';

const dummyCountries = [
  { id: 1, name: 'India' }, { id: 2, name: 'Kenya' }, { id: 3, name: 'USA' },
  { id: 4, name: 'Philippines' }, { id: 5, name: 'Canada' }, { id: 6, name: 'Malaysia' },
  { id: 7, name: 'KSA' }, { id: 8, name: 'Bahrain' }, { id: 9, name: 'Nepal' },
  { id: 10, name: 'Ireland' }, { id: 11, name: 'Nigeria' }, { id: 12, name: 'Finland' },
  { id: 13, name: 'China' }, { id: 14, name: 'Japan' }, { id: 15, name: 'Denmark' },
  { id: 16, name: 'France' }, { id: 17, name: 'South Korea' },
];

const countryCodeMap = {
  india: 'in', kenya: 'ke', usa: 'us', philippines: 'ph', canada: 'ca',
  malaysia: 'my', ksa: 'sa', bahrain: 'bh', nepal: 'np', ireland: 'ie',
  nigeria: 'ng', finland: 'fi', china: 'cn', japan: 'jp',
  denmark: 'dk', france: 'fr', 'south korea': 'kr',
};

export default function SelectCountry() {
  const { userId, token } = useAuth();
  const navigate = useNavigate();

  
const handleSelectCountry = async (countryId) => {
  const countryObj = dummyCountries.find((c) => c.id === countryId);
  if (!countryObj) return;

  try {
    const response = await createCountrySelection(userId, countryObj.name, token);
    console.log('✅ Country Created:', response);

    // Redirect to state selection with country name and ID
    navigate(`/select-state`, {
      state: {
        countryName: countryObj.name,
        countryId: response.id, // UUID returned from backend
      },
    });
  } catch (error) {
    console.error('❌ Error creating country selection:', error);
    alert('Something went wrong while creating the country.');
  }
};

  return (
    <AdminLayout>
      <div className="select-country-container">
        <h1>Select Your Country</h1>
        <p className="subtitle">Choose a country to proceed</p>

        <div className="country-grid">
          {dummyCountries.map((country) => {
            const isoCode = countryCodeMap[country.name.toLowerCase()];
            return (
              <div
                key={country.id}
                className="country-card"
                onClick={() => handleSelectCountry(country.id)}
              >
                {isoCode && (
                 <img
                    src={`https://flagcdn.com/w40/${isoCode}.png`}
                    alt={`${country.name} flag`}
                    className="flag-icon"
                  />
                )}
                <h3>{country.name}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
