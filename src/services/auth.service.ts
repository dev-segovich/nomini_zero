import axios from "axios";
import { LoginDto, RegisterDto } from "../types";

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

const authService = {
	async login(loginDto: LoginDto) {
		const response = await axios.post(`${API_URL}/login`, loginDto);
		if (response.data.access_token) {
			localStorage.setItem("user", JSON.stringify(response.data));
		}
		console.log(response.data);
		return response.data;
	},

	async register(registerDto: RegisterDto) {
		const response = await axios.post(`${API_URL}/register`, registerDto);
		return response.data;
	},

	logout() {
		localStorage.removeItem("user");
	},

	getCurrentUser() {
		const userStr = localStorage.getItem("user");
		if (userStr) return JSON.parse(userStr);
		return null;
	},

	async resetPassword(body: any) {
		const response = await axios.post(`${API_URL}/reset-password`, body);
		return response.data;
	},
};

export default authService;
