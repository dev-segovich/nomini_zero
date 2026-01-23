import React from "react";
import { useData } from "../context/DataContext";
import { PenalizationsModule } from "../components/PenalizationsModule";
import { payrollService } from "../services/payroll.service";

const PenaltiesPage: React.FC = () => {
	const { employees, penalizations, setPenalizations, setNotification } =
		useData();

	return (
		<PenalizationsModule
			employees={employees}
			penalizations={penalizations}
			onAddPenalization={async (p) => {
				try {
					const saved = await payrollService.createPenalization(p);
					setPenalizations((prev) => [...prev, saved]);
					setNotification("Penalización registrada.");
				} catch (err) {
					console.error("Error creating penalization:", err);
					setNotification("Error al registrar penalización.");
				}
			}}
		/>
	);
};

export default PenaltiesPage;
