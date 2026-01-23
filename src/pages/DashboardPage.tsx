import React from "react";
import { useData } from "../context/DataContext";
import { DashboardModule } from "../components/DashboardModule";
import { useOutletContext, useNavigate } from "react-router-dom";

const DashboardPage: React.FC = () => {
	const { employees, stats, history, loans, penalizations, handleUpdateBonus } =
		useData();

	const { setEditingEmployee } = useOutletContext() as any;
	const navigate = useNavigate();

	return (
		<DashboardModule
			employees={employees}
			stats={stats}
			history={history}
			loans={loans}
			penalizations={penalizations}
			onTabChange={(t) => {
				if (t === "PERSONAL") navigate("/personal");
				if (t === "PAGOS") navigate("/pagos");
				if (t === "PRESTAMOS") navigate("/prestamos");
			}}
			onOpenDepartments={() => {}} // This should open settings in MainLayout
			onGrantPerformanceBonus={handleUpdateBonus}
			onEditEmployee={(emp) => setEditingEmployee(emp)}
		/>
	);
};

export default DashboardPage;
