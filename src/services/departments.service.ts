import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/departments`;

const getAuthHeader = () => {
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	if (user && user.access_token) {
		return { Authorization: `Bearer ${user.access_token}` };
	}
	return {};
};

const departmentsService = {
	async getAll() {
		const response = await axios.get(API_URL, { headers: getAuthHeader() });
		return response.data;
	},

	async create(name: string) {
		const response = await axios.post(
			API_URL,
			{ name },
			{ headers: getAuthHeader() }
		);
		return response.data;
	},

	async remove(id: string) {
		const response = await axios.delete(`${API_URL}/${id}`, {
			headers: getAuthHeader(),
		});
		return response.data;
	},
};

export default departmentsService;
