import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import PersonalPage from "./pages/PersonalPage";
import PayrollPage from "./pages/PayrollPage";
import LoansPage from "./pages/LoansPage";
import PenaltiesPage from "./pages/PenaltiesPage";
import LiquidationPage from "./pages/LiquidationPage";
import { MainLayout } from "./layouts/MainLayout";

const App: React.FC = () => {
	const { user, isLoading } = useAuth();
	const [authView, setAuthView] = useState<"login" | "register">("login");

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-charcoal-darker">
				<div className="w-10 h-10 border-4 border-electric/30 border-t-electric rounded-full animate-spin"></div>
			</div>
		);
	}

	if (!user) {
		return authView === "login" ? (
			<LoginPage onRegister={() => setAuthView("register")} />
		) : (
			<RegisterPage onBackToLogin={() => setAuthView("login")} />
		);
	}

	return (
		<Routes>
			<Route element={<MainLayout />}>
				<Route path="/" element={<DashboardPage />} />
				<Route path="/personal" element={<PersonalPage />} />
				<Route path="/pagos" element={<PayrollPage />} />
				<Route path="/prestamos" element={<LoansPage />} />
				<Route path="/penalizaciones" element={<PenaltiesPage />} />
				<Route path="/liquidacion" element={<LiquidationPage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
};

export default App;
