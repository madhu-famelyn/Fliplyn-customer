// src/App.js
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import SignInPage from "./components/SignIn/SignIn";
import SignUpPage from "./components/SignUp/SignUp";

import icon1 from "./Assets/image1.png";
import icon2 from "./Assets/image2.png";
import icon3 from "./Assets/image3.png";
import icon4 from "./Assets/image4.png";
import icon5 from "./Assets/image5.png";
import icon6 from "./Assets/image6.png";
// ✅ Private Routes with persistent auth

// ✅ Auth Contexts
import { VendorAuthProvider, useVendorAuth } from "./components/AuthContex/VendorContext";
import { AuthProvider as AdminAuthProvider, useAuth as useAdminAuth } from "./components/AuthContex/AdminContext";
import { HrAuthProvider } from "./components/AuthContex/HrContext";
import { BuildingManagerProvider, useBuildingManagerAuth } from "./components/AuthContex/BuildingManagerContext";
import { B2CAuthProvider, useB2CAuth } from "./components/AuthContex/B2CContext";
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
import StallSalesReportVendor from "./components/Vendor/SalesSummary/SalesSummary";
// import ReportsPage from "./components/Vendor/ItemsList/Reports";
import OrdersByEmail from "./components/LayOutComponents/GetOrder/GetOrder";
import WalletUploadAdmin from "./components/LayOutComponents/ManagerWallet/ManagerWallet";
import ChangePassword from "./components/LayOutComponents/ChangePassword/ChangePassword";
import ChangeAdminPassword from "./components/LayOutComponents/ChangePassword/ChangeAdminPassword";
import ChangeVendorPassword from "./components/LayOutComponents/ChangePassword/ChangeVendorPassword";
import UpdateUserPassword from "./components/LayOutComponents/ChangePassword/ChangePasswordUser";
import ChangeHrPassword from "./components/LayOutComponents/ChangePassword/ChangeHRpassword";
import ChangeOMPassword from "./components/LayOutComponents/ChangePassword/ChangeManagerPassword";
import ChangeBuildingManagerPassword from "./components/LayOutComponents/ChangePassword/ChangeBuildingManagerPassword";
import HRDashboard from "./components/HR/Dashboard/Dashboard";
import HrLogin from "./components/HR/Login/LogIn";
import EmployeesPage from "./components/HR/EmployDetails/EmployeDetails";
import HROrdersPage from "./components/HR/EmployDetails/OrdersPage";
import HRDetails from "./components/HR/AddHR/AddHR";
import CreateHR from "./components/UserCreations/HRCreation/HRCreation";
import CreateUserAdmin from "./components/UserCreations/CreateUser/CreateUser";
import UpdateStatus from "./components/UserCreations/DeactiveUser/DeactiveUser";
import StallSalesReportAdmin from "./components/LayOutComponents/StallsSalesReportAdmin/StallsSalesReport";

import ItemListByStall from "./components/ManagerComponents/ManagerItems/ManagerItems";
import AddRefund from "./components/ManagerComponents/Reund/add-refund";
import StallsReport from "./components/ManagerComponents/Stalls_reports/StallsReport";
import AddStall from "./components/ManagerComponents/CreateStall/CreateStall";
import ViewBuildingManagers from "./components/UserCreations/BuildingManagerCreations/BuildingManager";
import ManagerStallIds from "./components/ManagerComponents/ManagerStalls/ManagerStalls";
import AddItemManager from "./components/LayOutComponents/ManagerItems/AddItems";
import ManagerCategory from "./components/ManagerComponents/AddCategory/Category";
import StallSalesReportOM from "./components/ManagerComponents/SalesSummary/SalesSummary";
import B2CTransactions from "./components/ManagerComponents/B2CTransactions/B2CTransactions";

import BuildingManagerLogin from "./components/BuildingManager/BuildingManager";
// import BuildingSalesReport from "./components/BuildingManager/BuilingMangerReport";

import MainPage from "./components/UserCreations/MainPage";
import ViewManagers from "./components/UserCreations/ManagerCreation/Manager";
import ViewVendors from "./components/UserCreations/VendorCreation/Vendor";
import ManagerViewVendors from "./components/ManagerComponents/AddVendor/AddVendor";
import WalletUpload from "./components/ManagerComponents/AddWallet/AddWallet";
import LoginSelectionPage from "./components/LoginSelection/LoginSelection";
import OrderStatus from "./components/OrderStatus/OrderStatus";
import B2CLogin from "./components/B2C/Login/Login";
import B2CHome from "./components/B2C/Home/Home";
import B2CStalls from "./components/B2C/Stalls/Stalls";
import B2CCategory from "./components/B2C/Category/Category";
import B2CCart from "./components/B2C/Cart/Cart";
import B2CPayment from "./components/B2C/PaymentPage/Payment";
import B2CPaymentSuccess from "./components/B2C/Success/Success";

import Events from "./components/pages/Events/Events";
import PageDashboard from "./components/pages/Dashboard/Dashboard";
import StallSalesReportBMSummary from "./components/BuildingManager/ReportSummary";
import SalesSummaryReport from "./components/LayOutComponents/SalesSummaryReport/SalesSummaryReport";

function BackgroundImages() {
  return (
    <div className="bg-images">
      <img src={icon1} className="bg-img img-1" alt="" />
      <img src={icon2} className="bg-img img-2" alt="" />
      <img src={icon3} className="bg-img img-3" alt="" />
      <img src={icon4} className="bg-img img-4" alt="" />
      <img src={icon5} className="bg-img img-5" alt="" />
      <img src={icon6} className="bg-img img-6" alt="" />
    </div>
  );
}

// ✅ Private Routes with persistent auth
const AdminPrivateRoute = ({ element }) => {
  const { token } = useAdminAuth();

  // Try to get token from context first, then fallback to localStorage
  const persistedToken = token || localStorage.getItem("adminToken");

  return persistedToken ? element : <Navigate to="/login" replace />;
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

const B2CPrivateRoute = ({ element }) => {
  const { token } = useB2CAuth();
  return token ? element : <Navigate to="/b2c-login" replace />;
};


function App() {
  const location = useLocation();
  const showBg = location.pathname.startsWith("/b2c") || location.pathname === "/b2c-home";

  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e) => {
      // Record the starting position and time of the touch
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const diffX = touchEndX - touchStartX;
      const diffY = Math.abs(touchEndY - touchStartY);
      const duration = touchEndTime - touchStartTime;

      // Swipe detection criteria (kept intact for future use):
      // 1. Swipe started within 120px from the left edge of the screen
      // 2. Horizontal swipe distance is at least 70px to the right
      // 3. Gesture is primarily horizontal (vertical drift < 60% of horizontal distance)
      // 4. Swipe completed within 500ms (quick gesture)
      const isSwipeBack =
        touchStartX < 120 &&
        diffX > 70 &&
        diffY < diffX * 0.6 &&
        duration < 500;

      if (isSwipeBack) {
        const path = window.location.pathname;

        // Route check: only consider B2C pages that are not the stalls landing or login page
        const isEligibleRoute =
          path.startsWith("/b2c") &&
          path !== "/b2c/stalls" &&
          path !== "/b2c-login";

        if (isEligibleRoute) {
          // ✅ Swipe detected — back navigation intentionally disabled.
          // To re-enable, uncomment the line below:
          // navigate(-1);
          console.log("👉 Swipe-back gesture detected (navigation disabled).");
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Cleanup listeners on unmount to avoid memory leaks
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
    // No dependency on `navigate` since it is no longer called inside the effect
  }, []);

  return (
    <AdminAuthProvider>
      <VendorAuthProvider>
        <HrAuthProvider>
          <BuildingManagerProvider>
            <B2CAuthProvider>
              <ManagerAuthProvider>
                {showBg && <BackgroundImages />}
                <Routes>
                  {/* 🔓 Public Routes */}
                  <Route path="/login" element={<SignInPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/manager-login" element={<ManagerLogin />} />

                  <Route path="/locations" element={<Locations />} />
                  <Route path="/select-country" element={<SelectCountry />} />
                  <Route path="/select-state" element={<SelectState />} />
                  <Route path="/select-city" element={<SelectCity />} />
                  <Route path="/create-building" element={<CreateBuilding />} />
                  <Route path="/stalls" element={<Stall />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/add-category/:stallId" element={<AddCategory />} />
                  <Route path="/manager-wallet" element={<WalletUploadAdmin />} />
                  <Route path="/item" element={<Item />} />
                  <Route path="/manager-details" element={<ManagerDetails />} />
                  <Route path="/manager-items" element={<ItemDetails />} />
                  <Route path="/add-money" element={<AddMoney />} />
                  <Route path="/items-admin" element={<AdminItems />} />
                  <Route path="/create-group" element={<Group />} />
                  <Route path="/token" element={<EnterTokenPage />} />
                  <Route path="/print-token/:tokenNumber" element={<TokenReceiptPage />} />
                  <Route path="/get-order-email" element={<AdminPrivateRoute element={<OrdersByEmail />} />} />
                  <Route path="/change-password" element={<AdminPrivateRoute element={<ChangePassword />} />} />
                  <Route path="/change/admin" element={<ChangeAdminPassword />} />
                  <Route path="/change/user" element={<UpdateUserPassword />} />
                  <Route path="/change/vendor" element={<ChangeVendorPassword />} />
                  <Route path="/change/hr" element={<ChangeHrPassword />} />
                  <Route path="change/om" element={<ChangeOMPassword />} />
                  <Route path="/change/manager" element={<ChangeBuildingManagerPassword />} />
                  <Route path="/view-building-managers" element={<ViewBuildingManagers />} />
                  <Route path="/create-hr" element={<CreateHR />} />
                  <Route path="/create-user-admin" element={<CreateUserAdmin />} />
                  <Route path="/deactivate-user" element={<UpdateStatus />} />
                  <Route path="/sales-summary" element={<SalesSummaryReport />} />
                  <Route
                    path="/stalls-report-admin"
                    element={<StallSalesReportAdmin />}
                  />






                  {/* 🛍️ Vendor Routes */}
                  <Route path="/vendor" element={<VendorLogin />} />
                  <Route path="/user" element={<User />} />
                  <Route path="/vendor-stall" element={<VendorStalls />} />
                  <Route path="/items-vendor/:id" element={<VendorPrivateRoute element={<VendorItems />} />} />
                  <Route path="/stall/:stallId/reports" element={<StallSalesReportVendor />} />
                  <Route path="/orders-status" element={<OrderStatus />} />
                  <Route path="/sales-report-vendor" element={<StallSalesReportVendor />} />


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
                  <Route path="/sales-summary-om" element={<StallSalesReportOM />} />
                  <Route path="/b2c-transactions" element={<ManagerPrivateRoute element={<B2CTransactions />} />} />



                  {/* 🏢 Building Manager Routes */}
                  <Route path="/bld-mng" element={<BuildingManagerLogin />} />
                  <Route path="/bld-mng-stalls" element={<BuildingManagerPrivateRoute element={<ManagerStallIds />} />} />
                  <Route path="/bld-mng-report" element={<BuildingManagerPrivateRoute element={<StallSalesReportBMSummary />} />} />
                  <Route path="/bld-report-summary" element={<BuildingManagerPrivateRoute element={<StallSalesReportBMSummary />} />} />


                  {/* 🛒 B2C Routes */}
                  <Route path="/b2c-home" element={<B2CPrivateRoute element={<B2CHome />} />} />
                  <Route path="/b2c-login" element={<B2CLogin />} />
                  <Route path="/b2c/stalls" element={<B2CPrivateRoute element={<B2CStalls />} />} />
                  <Route path="/b2c/categories/:stallId" element={<B2CPrivateRoute element={<B2CCategory />} />} />
                  <Route path="/b2c/cart" element={<B2CPrivateRoute element={<B2CCart />} />} />
                  <Route path="/b2c/payment" element={<B2CPrivateRoute element={<B2CPayment />} />} />
                  <Route path="/b2c/success" element={<B2CPrivateRoute element={<B2CPaymentSuccess />} />} />


                  {/* 👥 User Creation Routes */}
                  <Route path="/user-creation" element={<MainPage />} />
                  <Route path="/view-managers" element={<ViewManagers />} />
                  <Route path="/view-vendors" element={<ViewVendors />} />
                  <Route path="/" element={<LoginSelectionPage />} />


                  {/* pages */}
                  <Route path="/page-dashboard" element={<PageDashboard />} />
                  <Route path="/events" element={<Events />} />


                  {/* 🔚 Fallback */}
                </Routes>
              </ManagerAuthProvider>
            </B2CAuthProvider>
          </BuildingManagerProvider>
        </HrAuthProvider>
      </VendorAuthProvider>
    </AdminAuthProvider>
  );
}

export default App;
