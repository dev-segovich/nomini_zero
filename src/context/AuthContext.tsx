import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthResponse, LoginDto } from "../types";
import authService from "../services/auth.service";

interface AuthContextType {
	user: AuthResponse["user"] | null;
	login: (credentials: LoginDto) => Promise<void>;
	logout: () => void;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<AuthResponse["user"] | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const currentUser = authService.getCurrentUser();
		if (currentUser) {
			setUser(currentUser.user);
		}
		setIsLoading(false);
	}, []);

	const login = async (credentials: LoginDto) => {
		const data = await authService.login(credentials);
		setUser(data.user);
	};

	const logout = () => {
		authService.logout();
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, isLoading }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
