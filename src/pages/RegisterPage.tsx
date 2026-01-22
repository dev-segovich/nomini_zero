import React, { useState } from "react";
import axios from "axios";

interface RegisterPageProps {
	onBackToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToLogin }) => {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
				email,
				username,
				password,
			});
			setSuccess(true);
			setTimeout(() => onBackToLogin(), 2000);
		} catch (err: any) {
			setError(
				err.response?.data?.message ||
					"Error al registrar usuario. Intente con otro nombre o correo."
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-6 bg-charcoal-darker">
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-electric/10 blur-[120px] rounded-full"></div>
				<div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald/10 blur-[120px] rounded-full"></div>
			</div>

			<div className="relative w-full max-w-md animate-slide-in">
				<div className="bg-charcoal/80 backdrop-blur-2xl border border-white/5 rounded-[40px] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
					<div className="flex flex-col items-center mb-8">
						<div className="bg-emerald w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald/40 mb-6">
							<span className="material-symbols-outlined text-white text-4xl font-bold">
								person_add
							</span>
						</div>
						<h1 className="text-titanium text-4xl font-black tracking-tighter uppercase italic leading-none">
							REGISTRO
						</h1>
						<p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-3">
							Crear nueva cuenta
						</p>
					</div>

					{success ? (
						<div className="bg-emerald/10 border border-emerald/20 text-emerald text-sm font-black uppercase tracking-wider p-6 rounded-2xl text-center space-y-4">
							<span className="material-symbols-outlined text-4xl">
								check_circle
							</span>
							<p>¡Usuario registrado con éxito!</p>
							<p className="text-[10px] text-slate-500">
								Redirigiendo al login...
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-5">
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
									Correo Electrónico
								</label>
								<div className="relative group">
									<span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 group-focus-within:text-electric transition-colors">
										mail
									</span>
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-titanium font-bold focus:outline-none focus:border-electric/50 focus:bg-white/[0.08] transition-all"
										placeholder="correo@ejemplo.com"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
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
										className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-titanium font-bold focus:outline-none focus:border-electric/50 focus:bg-white/[0.08] transition-all"
										placeholder="mi_usuario"
										required
									/>
								</div>
							</div>

							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
									Contraseña
								</label>
								<div className="relative group">
									<span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 group-focus-within:text-electric transition-colors">
										lock
									</span>
									<input
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-titanium font-bold focus:outline-none focus:border-electric/50 focus:bg-white/[0.08] transition-all"
										placeholder="••••••••"
										required
									/>
								</div>
							</div>

							{error && (
								<div className="bg-crimson/10 border border-crimson/20 text-crimson text-[11px] font-black uppercase tracking-wider p-4 rounded-xl flex items-center gap-3">
									<span className="material-symbols-outlined text-lg">
										error
									</span>
									{error}
								</div>
							)}

							<button
								type="submit"
								disabled={isLoading}
								className="w-full h-16 bg-emerald hover:bg-emerald/80 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-emerald/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
							>
								{isLoading ? (
									<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								) : (
									<>
										<span>Registrar Cuenta</span>
										<span className="material-symbols-outlined">
											how_to_reg
										</span>
									</>
								)}
							</button>
						</form>
					)}

					<div className="mt-8 pt-8 border-t border-white/5 text-center">
						<p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
							¿Ya tienes cuenta?{" "}
							<button
								onClick={onBackToLogin}
								className="text-electric hover:underline"
							>
								Volver al Login
							</button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RegisterPage;
