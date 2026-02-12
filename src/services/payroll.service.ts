import axios from "axios";
import { PayrollWeek, Loan, Penalization } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3456";

const getAuthHeader = () => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	if (user && user.access_token) {
		return { Authorization: `Bearer ${user.access_token}` };
	}
	return {};
};

export const payrollService = {
	getHistory: async (): Promise<PayrollWeek[]> => {
		const response = await axios.get(`${API_URL}/payroll`, {
			headers: getAuthHeader(),
		});
		return response.data;
	},

	createCycle: async (payload: any): Promise<PayrollWeek> => {
		const response = await axios.post(`${API_URL}/payroll`, payload, {
			headers: getAuthHeader(),
		});
		return response.data;
	},

	getLoans: async (): Promise<Loan[]> => {
		const response = await axios.get(`${API_URL}/payroll/loans`, {
			headers: getAuthHeader(),
		});
		return response.data;
	},

	createLoan: async (loan: Partial<Loan>): Promise<Loan> => {
		const { id, ...loanData } = loan;

		const response = await axios.post(`${API_URL}/payroll/loans`, loanData, {
			headers: getAuthHeader(),
		});
		return response.data;
	},

	getPenalizations: async (): Promise<Penalization[]> => {
		const response = await axios.get(`${API_URL}/payroll/penalizations`, {
			headers: getAuthHeader(),
		});
		return response.data;
	},

	createPenalization: async (	
		penalization: Partial<Penalization>
	): Promise<Penalization> => {
		const { id, ...penalizationData } = penalization;

		const response = await axios.post(
			`${API_URL}/payroll/penalizations`,
			penalizationData,
			{ headers: getAuthHeader() }
		);
		return response.data;
	},
};
