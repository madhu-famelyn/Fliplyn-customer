import { Routes, Route, Navigate } from 'react-router-dom';
import SignInPage from './components/SignIn/SignIn';
import SignUpPage from './components/SignUp/SignUp';
import { AuthProvider, useAuth } from './components/AuthContex/ContextAPI';
import Dashboard from './components/LayOutComponents/DashBoard/Dashboard';
import Locations from './components/LayOutComponents/Location/Location';
import SelectCountry from './components/LayOutComponents/SelectCountry/SelectCountry';
import SelectState from './components/LayOutComponents/SelectState/SelectState';
import SelectCity from './components/LayOutComponents/SelectCity/SelectCity';
import CreateBuilding from './components/LayOutComponents/SelectBuilding/SelectBuilding';
import User from './components/LayOutComponents/User/User';
import Stall from './components/LayOutComponents/stalls/Stalls';
import AddCategory from './components/LayOutComponents/Category/Category';
import Item from './components/LayOutComponents/Items/Items';
import ManagerLogin from './components/Manager_login/Manager_login';
import ManagerStalls from './components/LayOutComponents/ManagerStalls/ManegarStalls';
import ManagerDetails from './components/LayOutComponents/ManagerDetails/ManagerDetails'; 
import ItemDetails from './components/LayOutComponents/ManagerItems/Items';
import AddMoney from './components/LayOutComponents/Wallet/Wallet';
import AdminItems from './components/LayOutComponents/Admin-Items/Items';
import CreateGroup from './components/LayOutComponents/CreateGroup/CreateGroup';

const PrivateRoute = ({ element }) => {
  const { token } = useAuth();
  return token ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/select-country" element={<SelectCountry />} />
        <Route path="/select-state" element={<SelectState />} />
        <Route path="/select-city" element={<SelectCity />} />
        <Route path="/create-building" element={<CreateBuilding />} />
        <Route path="/stalls" element={<Stall />} />
        <Route path="/add-category/:stallId" element={<AddCategory />} /> {/* ✅ new route */}
        <Route path="/item" element={<Item />} />
        <Route path="/manager-login" element={<ManagerLogin />} />
        <Route path="/manager-stalls" element={<ManagerStalls />} />
        <Route path="/manager-details" element={<ManagerDetails />} />
        <Route path="/manager-items" element={<ItemDetails />} />
        <Route path="/add-money" element={<AddMoney />} />
        <Route path="/items-admin" element={<AdminItems/>}/>
        <Route path="/create-group" element = {<CreateGroup/>}></Route>
        
        {/* Private Routes */}

        <Route path="/user" element={<User />} />


        <Route path="*" element={<SignInPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
