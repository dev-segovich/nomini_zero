import React from "react";
import { useData } from "../context/DataContext";
import { LoansModule } from "../components/LoansModule";
import { payrollService } from "../services/payroll.service";

const LoansPage: React.FC = () => {
	const { employees, loans, setLoans, setNotification } = useData();

	return (
		<LoansModule
			employees={employees}
			loans={loans}
			onAddLoan={async (l) => {
				try {
					const saved = await payrollService.createLoan(l);
					setLoans((p) => [...p, saved]);
					setNotification("Préstamo registrado exitosamente.");
				} catch (err) {
					console.error("Error creating loan:", err);
					setNotification("Error al registrar préstamo.");
				}
			}}
		/>
	);
};

export default LoansPage;
