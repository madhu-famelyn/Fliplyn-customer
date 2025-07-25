import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '../../LayOut/AdminLayout';
import { createStateSelection } from './Service';
import './SelectState.css';
import { useAuth } from '../../AuthContex/ContextAPI';

export default function SelectState() {
  const { state } = useLocation(); // Expects: countryId, countryName
  const { userId, token } = useAuth();
  const navigate = useNavigate();

  const [stateName, setStateName] = useState('');
  const [allStates, setAllStates] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const popularStates = {
    India: ['Telangana', 'Tamil Nadu', 'Karnataka', 'Delhi', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan', 'Andhra Pradesh', 'Punjab'],
    USA: ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'],
    Canada: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Nova Scotia', 'Saskatchewan', 'New Brunswick', 'Newfoundland and Labrador', 'Prince Edward Island'],
    Philippines: ['Metro Manila', 'Cebu', 'Davao del Sur', 'Iloilo', 'Batangas', 'Pampanga', 'Laguna', 'Cavite', 'Negros Occidental', 'Bulacan'],
    Kenya: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Naivasha', 'Kitale', 'Garissa'],
    Malaysia: ['Selangor', 'Kuala Lumpur', 'Johor', 'Penang', 'Sabah', 'Sarawak', 'Perak', 'Kelantan', 'Negeri Sembilan', 'Pahang'],
    KSA: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Hail', 'Najran'],
    Bahrain: ['Manama', 'Riffa', 'Muharraq', 'Isa Town', 'Sitra', 'Budaiya', 'Jidhafs', 'Zallaq', 'Aali', 'Sanabis'],
    Nepal: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Janakpur', 'Hetauda'],
    Ireland: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Swords', 'Dundalk', 'Bray', 'Navan'],
    Nigeria: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Benin City', 'Port Harcourt', 'Jos', 'Enugu', 'Abeokuta', 'Ilorin'],
    Finland: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori'],
    China: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Wuhan', 'Xi\'an', 'Hangzhou', 'Tianjin', 'Nanjing'],
    Japan: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Sapporo', 'Fukuoka', 'Nagoya', 'Hiroshima', 'Sendai', 'Kobe'],
    Denmark: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde'],
    France: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Goyang']
  };

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: state?.countryName })
        });
        const data = await response.json();
        if (data.data?.states) {
          setAllStates(data.data.states.map((s) => s.name));
        }
      } catch (error) {
        console.error('❌ Failed to fetch state list:', error);
      }
    };

    if (state?.countryName) fetchStates();
  }, [state?.countryName]);

  const handleSubmit = async () => {
    if (!stateName || !state?.countryId) return;
    try {
      const result = await createStateSelection(userId, state.countryId, stateName, token);
      const stateId = result?.id || result?.state_id || 'fallback-state-id';

      setSuccessMessage(`✅ State "${stateName}" created.`);

      // ⏩ Navigate to city selection
      navigate('/select-city', {
        state: {
          adminId: userId,
          countryId: state.countryId,
          countryName: state.countryName,
          stateId,
          stateName,
        },
      });
    } catch (error) {
      console.error('❌ Error creating state:', error);
      setSuccessMessage('❌ Failed to create state.');
    }
  };

  const topStates = popularStates[state?.countryName] || [];

  return (
    <AdminLayout>
      <div className="select-state-container">
        <h2>Select a State from {state?.countryName}</h2>

        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}

        <div className="popular-states">
          {topStates.map((st) => (
            <button
              key={st}
              className="popular-state-button"
              onClick={() => setStateName(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <input
          list="state-options"
          className="state-input"
          value={stateName}
          onChange={(e) => setStateName(e.target.value)}
          placeholder="Search or type a state"
        />
        <datalist id="state-options">
          {allStates.map((st) => (
            <option key={st} value={st} />
          ))}
        </datalist>

        <button onClick={handleSubmit} className="submit-button" disabled={!stateName}>
          Submit
        </button>
      </div>
    </AdminLayout>
  );
}
