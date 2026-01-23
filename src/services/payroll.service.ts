import axios from "axios";
import { PayrollWeek, Loan, Penalization } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3456";

export const payrollService = {
	getHistory: async (): Promise<PayrollWeek[]> => {
		const response = await axios.get(`${API_URL}/payroll`);
		// Convert strings to dates/numbers if needed, though Axios mostly handles it
		return response.data;
	},

	createCycle: async (payload: any): Promise<PayrollWeek> => {
		const response = await axios.post(`${API_URL}/payroll`, payload);
		return response.data;
	},

	getLoans: async (): Promise<Loan[]> => {
		const response = await axios.get(`${API_URL}/payroll/loans`);
		return response.data;
	},

	createLoan: async (loan: Partial<Loan>): Promise<Loan> => {
		const response = await axios.post(`${API_URL}/payroll/loans`, loan);
		return response.data;
	},

	getPenalizations: async (): Promise<Penalization[]> => {
		const response = await axios.get(`${API_URL}/payroll/penalizations`);
		return response.data;
	},

	createPenalization: async (
		penalization: Partial<Penalization>
	): Promise<Penalization> => {
		const response = await axios.post(
			`${API_URL}/payroll/penalizations`,
			penalization
		);
		return response.data;
	},
};
