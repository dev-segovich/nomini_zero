import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import authService from "../services/auth.service";

interface LoginPageProps {
	onRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onRegister }) => {
	const [view, setView] = useState<"login" | "forgot" | "reset">("login");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [token, setToken] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			await login({ username, password });
		} catch (err: any) {
			setError(
				err.response?.data?.message ||
					"Error al iniciar sesión. Verifique sus credenciales."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleTokenValidation = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (!username) {
			setError("Introduzca su usuario primero.");
			return;
		}
		if (token === "000000") {
			setView("reset");
		} else {
			setError("Token inválido. Intente con '000000'.");
		}
	};

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			await authService.resetPassword({
				username,
				token,
				newPassword,
			});
			setSuccess("Contraseña restablecida. Ya puede iniciar sesión.");
			setTimeout(() => {
				setView("login");
				setSuccess("");
				setToken("");
				setNewPassword("");
			}, 3000);
		} catch (err: any) {
			setError(
				err.response?.data?.message || "Error al restablecer contraseña."
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-6 bg-charcoal-darker">
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-electric/10 blur-[120px] rounded-full"></div>
				<div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald/10 blur-[120px] rounded-full"></div>
			</div>

			<div className="relative w-full max-w-md animate-slide-in">
				<div className="bg-charcoal/80 backdrop-blur-2xl border border-white/5 rounded-[40px] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
					{/* Header */}
					<div className="flex flex-col items-center mb-10">
						<div className="bg-electric w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl shadow-electric/40 mb-6 transition-all duration-500 hover:scale-110">
							<span className="material-symbols-outlined text-white text-4xl font-bold">
								{view === "login" ? "diamond" : "lock_reset"}
							</span>
						</div>
						<h1 className="text-titanium text-4xl font-black tracking-tighter uppercase italic leading-none">
							{view === "login"
								? "NOMINI"
								: view === "forgot"
									? "Recuperar"
									: "Nueva Clave"}
						</h1>
						<p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-3">
							{view === "login" ? "Payroll OS v1.0" : "Sistema de Seguridad"}
						</p>
					</div>

					{success && (
						<div className="bg-emerald/10 border border-emerald/20 text-emerald text-[11px] font-black uppercase tracking-wider p-4 rounded-xl flex items-center gap-3 mb-6 animate-slide-in">
							<span className="material-symbols-outlined text-lg">
								check_circle
							</span>
							{success}
						</div>
					)}

					{error && (
						<div className="bg-crimson/10 border border-crimson/20 text-crimson text-[11px] font-black uppercase tracking-wider p-4 rounded-xl flex items-center gap-3 mb-6 animate-slide-in">
							<span className="material-symbols-outlined text-lg">error</span>
							{error}
						</div>
					)}

					{/* Login View */}
					{view === "login" && (
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
									Usuario
								</label>
								<div className="relative group">
									<span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 group-focus-within:text-electric transition-colors">
										person
									</span>
									<input
										type="text"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-titanium font-bold focus:outline-none focus:border-electric/50 focus:bg-white/[0.08] transition-all"
										placeholder="alias"
										required
									/>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-3 ml-1">
									<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
										Contraseña
									</label>
									<button
										type="button"
										onClick={() => setView("forgot")}
										className="text-[10px] font-black text-electric/60 hover:text-electric transition-colors uppercase tracking-widest"
									>
										¿Olvidó su clave?
									</button>
								</div>
								<div className="relative group">
									<span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 group-focus-within:text-electric transition-colors">
										lock
									</span>
									<input
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-titanium font-bold focus:outline-none focus:border-electric/50 focus:bg-white/[0.08] transition-all"
										placeholder="••••••••"
										required
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full h-16 bg-electric hover:bg-electric-light text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-electric/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
							>
								{isLoading ? (
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								) : (
									<>
										<span>Acceder al Sistema</span>
										<span className="material-symbols-outlined">
											arrow_forward
										</span>
									</>
								)}
							</button>
						</form>
					)}

					{/* Forgot (Token) View */}
					{view === "forgot" && (
						<form onSubmit={handleTokenValidation} className="space-y-6">
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
									Confirmar Usuario
								</label>
								<div className="relative group">
									<span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 group-focus-within:text-electric transition-colors">
										account_circle
									</span>
									<input
										type="text"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-titanium font-bold focus:outline-none focus:border-electric/50 focus:bg-white/[0.08] transition-all"
										placeholder="alias"
										required
									/>
								</div>
							</div>
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
									Token de Seguridad
								</label>
								<div className="relative group">
									<span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 group-focus-within:text-electric transition-colors">
										key
									</span>
									<input
										type="text"
										value={token}
										onChange={(e) => setToken(e.target.value)}
										className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-titanium font-bold focus:outline-none focus:border-electric/50 focus:bg-white/[0.08] transition-all text-center tracking-[1em]"
										placeholder="000000"
										required
										maxLength={6}
									/>
								</div>
							</div>

							<div className="flex flex-col gap-3">
								<button
									type="submit"
									className="w-full h-16 bg-electric text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]"
								>
									Validar Token
								</button>
								<button
									type="button"
									onClick={() => setView("login")}
									className="w-full h-14 bg-white/5 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10"
								>
									Cancelar
								</button>
							</div>
						</form>
					)}

					{/* Reset View */}
					{view === "reset" && (
						<form onSubmit={handleResetPassword} className="space-y-6">
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
									Nueva Contraseña
								</label>
								<div className="relative group">
									<span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 group-focus-within:text-electric transition-colors">
										lock_open
									</span>
									<input
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-titanium font-bold focus:outline-none focus:border-electric/50 focus:bg-white/[0.08] transition-all"
										placeholder="••••••••"
										required
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full h-16 bg-emerald text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-emerald/20 active:scale-[0.98] disabled:opacity-50"
							>
								{isLoading ? "Restableciendo..." : "Actualizar Contraseña"}
							</button>
						</form>
					)}

					<div className="mt-10 pt-10 border-t border-white/5 text-center">
						<p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
							¿No tienes cuenta?{" "}
							<button
								type="button"
								onClick={onRegister}
								className="text-emerald hover:underline font-black italic"
							>
								Regístrate aquí
							</button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
