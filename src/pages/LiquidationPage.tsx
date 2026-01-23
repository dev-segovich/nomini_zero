import React from "react";
import { useData } from "../context/DataContext";
import { LiquidationModule } from "../components/LiquidationModule";

const LiquidationPage: React.FC = () => {
	const { employees } = useData();

	return <LiquidationModule employees={employees} />;
};

export default LiquidationPage;
