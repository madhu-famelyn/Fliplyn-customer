// src/App.js
import { Routes, Route, Navigate } from "react-router-dom";
import SignInPage from "./components/SignIn/SignIn";
import SignUpPage from "./components/SignUp/SignUp";

// ✅ Auth Contexts
import { VendorAuthProvider, useVendorAuth } from "./components/AuthContex/VendorContext";
import { AuthProvider as AdminAuthProvider, useAuth as useAdminAuth } from "./components/AuthContex/AdminContext";
import { HrAuthProvider } from "./components/AuthContex/HrContext";
import { BuildingManagerProvider, useBuildingManagerAuth } from "./components/AuthContex/BuildingManagerContext";
import { AuthProvider as ManagerAuthProvider, useAuth as useManagerAuth } from "./components/AuthContex/ContextAPI"; // Operational Manager

// ✅ Components
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
import ManagerDetails from "./components/LayOutComponents/ManagerDetails/ManagerDetails";
import ItemDetails from "./components/LayOutComponents/ManagerItems/Items";
import AddMoney from "./components/LayOutComponents/Wallet/Wallet";
import AdminItems from "./components/LayOutComponents/Admin-Items/Items";
import Group from "./components/LayOutComponents/CreateGroup/Groups";
import EnterTokenPage from "./components/LayOutComponents/PrintToken/EnterTokenPage";
import TokenReceiptPage from "./components/LayOutComponents/PrintToken/TokenRecipetentPage";
import VendorLogin from "./components/Vendor/Login/Login";
import VendorItems from "./components/Vendor/ItemsList/Items";
import VendorStalls from "./components/Vendor/Stalls/Stalls";
import ReportsPage from "./components/Vendor/ItemsList/Reports";
import OrdersByEmail from "./components/LayOutComponents/GetOrder/GetOrder";
import WalletUploadAdmin from "./components/LayOutComponents/ManagerWallet/ManagerWallet";
import ChangePassword from "./components/LayOutComponents/ChangePassword/ChangePassword";

import HRDashboard from "./components/HR/Dashboard/Dashboard";
import HrLogin from "./components/HR/Login/LogIn";
import EmployeesPage from "./components/HR/EmployDetails/EmployeDetails";
import HROrdersPage from "./components/HR/EmployDetails/OrdersPage";
import HRDetails from "./components/HR/AddHR/AddHR";

import ItemListByStall from "./components/ManagerComponents/ManagerItems/ManagerItems";
import AddRefund from "./components/ManagerComponents/Reund/add-refund";
import StallsReport from "./components/ManagerComponents/Stalls_reports/StallsReport";
import AddStall from "./components/ManagerComponents/CreateStall/CreateStall";
import ManagerStallIds from "./components/ManagerComponents/ManagerStalls/ManagerStalls";
import AddItemManager from "./components/LayOutComponents/ManagerItems/AddItems";
import ManagerCategory from "./components/ManagerComponents/AddCategory/Category";

import BuildingManagerLogin from "./components/BuildingManager/BuildingManager";
import BuildingSalesReport from "./components/BuildingManager/BuilingMangerReport";

import MainPage from "./components/UserCreations/MainPage";
import ViewManagers from "./components/UserCreations/ManagerCreation/Manager";
import ViewVendors from "./components/UserCreations/VendorCreation/Vendor";
import ManagerViewVendors from "./components/ManagerComponents/AddVendor/AddVendor";
import WalletUpload from "./components/ManagerComponents/AddWallet/AddWallet";

// ✅ Private Routes with persistent auth
const AdminPrivateRoute = ({ element }) => {
  const { token } = useAdminAuth();
  return token ? element : <Navigate to="/login" replace />;
};

const VendorPrivateRoute = ({ element }) => {
  const { token } = useVendorAuth();
  return token ? element : <Navigate to="/vendor" replace />;
};

const BuildingManagerPrivateRoute = ({ element }) => {
  const { token } = useBuildingManagerAuth();
  return token ? element : <Navigate to="/bld-mng" replace />;
};

const ManagerPrivateRoute = ({ element }) => {
  const { token, loading } = useManagerAuth();

  if (loading) {
    // Optionally show a spinner or nothing until loading completes
    return <div>Loading...</div>;
  }

  return token ? element : <Navigate to="/manager-login" replace />;
};


function App() {
  return (
    <AdminAuthProvider>
      <VendorAuthProvider>
        <HrAuthProvider>
          <BuildingManagerProvider>
            <ManagerAuthProvider>
              <Routes>
                {/* 🔓 Public Routes */}
                <Route path="/login" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/manager-login" element={<ManagerLogin />} />

                {/* ✅ Admin Routes */}
                <Route path="/dashboard" element={<AdminPrivateRoute element={<Dashboard />} />} />
                <Route path="/locations" element={<AdminPrivateRoute element={<Locations />} />} />
                <Route path="/select-country" element={<AdminPrivateRoute element={<SelectCountry />} />} />
                <Route path="/select-state" element={<AdminPrivateRoute element={<SelectState />} />} />
                <Route path="/select-city" element={<AdminPrivateRoute element={<SelectCity />} />} />
                <Route path="/create-building" element={<AdminPrivateRoute element={<CreateBuilding />} />} />
                <Route path="/stalls" element={<AdminPrivateRoute element={<Stall />} />} />
                <Route path="/add-category/:stallId" element={<AdminPrivateRoute element={<AddCategory />} />} />
                <Route path="/manager-wallet" element={<AdminPrivateRoute element={<WalletUploadAdmin />} />} />
                <Route path="/item" element={<AdminPrivateRoute element={<Item />} />} />
                <Route path="/manager-details" element={<AdminPrivateRoute element={<ManagerDetails />} />} />
                <Route path="/manager-items" element={<AdminPrivateRoute element={<ItemDetails />} />} />
                <Route path="/add-money" element={<AdminPrivateRoute element={<AddMoney />} />} />
                <Route path="/items-admin" element={<AdminPrivateRoute element={<AdminItems />} />} />
                <Route path="/create-group" element={<AdminPrivateRoute element={<Group />} />} />
                <Route path="/token" element={<AdminPrivateRoute element={<EnterTokenPage />} />} />
                <Route path="/print-token/:tokenNumber" element={<TokenReceiptPage />} />
                <Route path="/get-order-email" element={<AdminPrivateRoute element={<OrdersByEmail />} />} />
                <Route path="/change-password" element={<AdminPrivateRoute element={<ChangePassword />} />} />


                {/* 🛍️ Vendor Routes */}
                <Route path="/vendor" element={<VendorLogin />} />
                <Route path="/user" element={<User />} />
                <Route path="/vendor-stall" element={<VendorStalls />} />
                <Route path="/items-vendor/:id" element={<VendorPrivateRoute element={<VendorItems />} />} />
                <Route path="/stall/:stallId/reports" element={<ReportsPage />} />

                {/* 🧾 HR Routes */}
                <Route path="/hr" element={<HrLogin />} />
                <Route path="/hr-dashboard" element={<HRDashboard />} />
                <Route path="/wallet-group/:groupId" element={<EmployeesPage />} />
                <Route path="/order-history" element={<HROrdersPage />} />
                <Route path="/hr-details" element={<HRDetails />} />


                {/* 🧑‍🔧 Operational Manager Routes */}
                <Route path="/add-refund" element={<ManagerPrivateRoute element={<AddRefund />} />} />
                <Route path="/add-stall" element={<ManagerPrivateRoute element={<AddStall />} />} />
                <Route path="/manager-stalls" element={<ManagerPrivateRoute element={<ManagerStallIds />} />} />
                <Route path="/manager-items/:stallId" element={<ManagerPrivateRoute element={<ItemListByStall />} />} />
                <Route path="/manager-view-vendors" element={<ManagerPrivateRoute element={<ManagerViewVendors />} />} />
                <Route path="/wallet-add-mng" element={<ManagerPrivateRoute element={<WalletUpload />} />} />
                <Route path="/add-category" element={<ManagerPrivateRoute element={<ManagerCategory />} />} />
                <Route path="/view-sales" element={<StallsReport />} />
                <Route path="/add-item-manager" element={<AddItemManager />} />

                

                {/* 🏢 Building Manager Routes */}
                <Route path="/bld-mng" element={<BuildingManagerLogin />} />
                <Route path="/bld-mng-stalls" element={<BuildingManagerPrivateRoute element={<ManagerStallIds />} />} />
                <Route path="/bld-mng-report" element={<BuildingManagerPrivateRoute element={<BuildingSalesReport />} />} />

                {/* 👥 User Creation Routes */}
                <Route path="/user-creation" element={<MainPage />} />
                <Route path="/view-managers" element={<ViewManagers />} />
                <Route path="/view-vendors" element={<ViewVendors />} />

                {/* 🔚 Fallback */}
                <Route path="*" element={<SignInPage />} />
              </Routes>
            </ManagerAuthProvider>
          </BuildingManagerProvider>
        </HrAuthProvider>
      </VendorAuthProvider>
    </AdminAuthProvider>
  );
}

export default App;
