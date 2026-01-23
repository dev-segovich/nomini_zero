import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/employees`;

const getAuthHeader = () => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	if (user && user.access_token) {
		return { Authorization: `Bearer ${user.access_token}` };
	}
	return {};
};

const cleanData = (data: any) => {
	const { id, department, createdAt, updatedAt, userId, ...rest } = data;
	return rest;
};

const employeesService = {
	async getAll() {
		const response = await axios.get(API_URL, { headers: getAuthHeader() });
		return response.data;
	},

	async getOne(id: string) {
		const response = await axios.get(`${API_URL}/${id}`, {
			headers: getAuthHeader(),
		});
		return response.data;
	},

	async create(data: any) {
		const cleaned = cleanData(data);
		const response = await axios.post(API_URL, cleaned, {
			headers: getAuthHeader(),
		});
		return response.data;
	},

	async update(id: string, data: any) {
		const cleaned = cleanData(data);
		const response = await axios.patch(`${API_URL}/${id}`, cleaned, {
			headers: getAuthHeader(),
		});
		return response.data;
	},

	async remove(id: string) {
		const response = await axios.delete(`${API_URL}/${id}`, {
			headers: getAuthHeader(),
		});
		return response.data;
	},
};

export default employeesService;
