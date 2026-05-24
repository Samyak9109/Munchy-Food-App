import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PartnerLogin from "../pages/PartnerLogin";
import PartnerRegister from "../pages/PartnerRegister";
import UserLogin from "../pages/UserLogin";
import UserRegister from "../pages/UserRegister";
 
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/user/register" element={<UserRegister />} />
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/partner/register" element={<PartnerRegister />} />
        <Route path="/partner/login" element={<PartnerLogin />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;