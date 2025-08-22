import { Routes, Route, Navigate } from "react-router-dom";
import SignInPage from "./components/SignIn/SignIn";
import SignUpPage from "./components/SignUp/SignUp";

import {
  AuthProvider as VendorAuthProvider,
  useAuth as useVendorAuth,
} from "./components/AuthContex/ContextAPI";

import {
  AuthProvider as AdminAuthProvider,
  useAuth as useAdminAuth,
} from "./components/AuthContex/AdminContext";

import { HrAuthProvider } from "./components/AuthContex/HrContext";


import Dashboard from "./components/LayOutComponents/DashBoard/Dashboard";
import Locations from "./components/LayOutComponents/Location/Location";
import SelectCountry from "./components/LayOutComponents/SelectCountry/SelectCountry";
import SelectState from "./components/LayOutComponents/SelectState/SelectState";
import SelectCity from "./components/LayOutComponents/SelectCity/SelectCity";
import CreateBuilding from "./components/LayOutComponents/SelectBuilding/SelectBuilding";
import User from "./components/LayOutComponents/User/User";
import Stall from "./components/LayOutComponents/stalls/Stalls";
import AddCategory from "./components/LayOutComponents/Category/Category";
import Item from "./components/LayOutComponents/Items/Items";
import ManagerLogin from "./components/Manager_login/Manager_login";
import ManagerStalls from "./components/LayOutComponents/ManagerStalls/ManegarStalls";
import ManagerDetails from "./components/LayOutComponents/ManagerDetails/ManagerDetails";
import ItemDetails from "./components/LayOutComponents/ManagerItems/Items";
import AddMoney from "./components/LayOutComponents/Wallet/Wallet";
import AdminItems from "./components/LayOutComponents/Admin-Items/Items";
import Group from "./components/LayOutComponents/CreateGroup/Groups";

import EnterTokenPage from "./components/LayOutComponents/PrintToken/EnterTokenPage";
import TokenReceiptPage from "./components/LayOutComponents/PrintToken/TokenRecipetentPage";
import VendorLogin from "./components/Vendor/Login/Login";
import VendorItems from "./components/Vendor/ItemsList/Items";
import HRDashboard from "./components/HR/Dashboard/Dashboard";

import HrLogin from "./components/HR/Login/LogIn";
import EmployeesPage from "./components/HR/EmployDetails/EmployeDetails";
import HROrdersPage from "./components/HR/EmployDetails/OrdersPage";
// import HrLogin from "./components/HR/Login/Login";

// Private route for Admin
const AdminPrivateRoute = ({ element }) => {
  const { token } = useAdminAuth();
  return token ? element : <Navigate to="/login" />;
};

// Private route for Vendor
const VendorPrivateRoute = ({ element }) => {
  const { token } = useVendorAuth();
  return token ? element : <Navigate to="/vendor" />;
};

function App() {
  return (
    <AdminAuthProvider>
      <VendorAuthProvider>
        <HrAuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Admin Routes */}
          <Route path="/dashboard" element={<AdminPrivateRoute element={<Dashboard />} />} />
          <Route path="/locations" element={<AdminPrivateRoute element={<Locations />} />} />
          <Route path="/select-country" element={<AdminPrivateRoute element={<SelectCountry />} />} />
          <Route path="/select-state" element={<AdminPrivateRoute element={<SelectState />} />} />
          <Route path="/select-city" element={<AdminPrivateRoute element={<SelectCity />} />} />
          <Route path="/create-building" element={<AdminPrivateRoute element={<CreateBuilding />} />} />
          <Route path="/stalls" element={<AdminPrivateRoute element={<Stall />} />} />
          <Route path="/add-category/:stallId" element={<AdminPrivateRoute element={<AddCategory />} />} />
          <Route path="/item" element={<AdminPrivateRoute element={<Item />} />} />
          <Route path="/manager-login" element={<ManagerLogin />} />
          <Route path="/manager-stalls" element={<AdminPrivateRoute element={<ManagerStalls />} />} />
          <Route path="/manager-details" element={<AdminPrivateRoute element={<ManagerDetails />} />} />
          <Route path="/manager-items" element={<AdminPrivateRoute element={<ItemDetails />} />} />
          <Route path="/add-money" element={<AdminPrivateRoute element={<AddMoney />} />} />
          <Route path="/items-admin" element={<AdminPrivateRoute element={<AdminItems />} />} />
          <Route path="/create-group" element={<AdminPrivateRoute element={<Group />} />} />
          <Route path="/token" element={<AdminPrivateRoute element={<EnterTokenPage />} />} />
          <Route path="/print-token/:tokenNumber" element={<TokenReceiptPage />} />


          {/* Vendor Routes */}
          <Route path="/vendor" element={<VendorLogin />} />
          <Route path="/user" element={<VendorPrivateRoute element={<User />} />} />
          <Route path="/items-vendor" element={<VendorPrivateRoute element={<VendorItems />} />} />


          <Route path="/hr" element={<HrLogin/>} />
          <Route path="/hr-dashboard" element={<HRDashboard/>}/>
          <Route path="/wallet-group/:groupId" element={<EmployeesPage />} />
          <Route path="/order-history" element={<HROrdersPage />} />


          {/* Fallback */}
          <Route path="*" element={<SignInPage />} />
        </Routes>
        </HrAuthProvider>
      </VendorAuthProvider>
    </AdminAuthProvider>
  );
}

export default App;
