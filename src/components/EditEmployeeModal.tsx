import React, { useState, useRef, useMemo } from "react";
import { Employee, Loan, Penalization, DeptObj } from "../types";
import { formatCurrency } from "../utils";
import { DEFAULT_AVATAR } from "../constants";
import { compressImage } from "../utils/imageCompression";

interface EditEmployeeModalProps {
	employee: Employee;
	departments: DeptObj[];
	loans: Loan[];
	penalizations: Penalization[];
	isNew?: boolean;
	onSave: (updated: Employee) => void;
	onClose: () => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
	employee,
	departments,
	loans,
	penalizations,
	isNew,
	onSave,
	onClose,
}) => {
	const [formData, setFormData] = useState<Employee>({ ...employee });

	// Local state for display values to handle bi-weekly conversion smoothly
	const getMultiplier = (freq: string | undefined) =>
		freq === "quincenal" ? 2 : 1;

	const [displaySalary, setDisplaySalary] = useState<string>(
		(
			(employee.baseWeeklySalary || 0) *
			getMultiplier(employee.paymentFrequency)
		).toFixed(2)
	);
	const [displayBonus, setDisplayBonus] = useState<string>(
		(
			(employee.weeklyBonus || 0) * getMultiplier(employee.paymentFrequency)
		).toFixed(2)
	);

	const handleFrequencyChange = (freq: "semanal" | "quincenal") => {
		const newMult = freq === "quincenal" ? 2 : 1;
		// Update display values based on the current base values
		setDisplaySalary(((formData.baseWeeklySalary || 0) * newMult).toFixed(2));
		setDisplayBonus(((formData.weeklyBonus || 0) * newMult).toFixed(2));
		setFormData((prev) => ({ ...prev, paymentFrequency: freq }));
	};

	const handleSalaryChange = (val: string) => {
		setDisplaySalary(val);
		const num = parseFloat(val) || 0;
		const mult = getMultiplier(formData.paymentFrequency);
		setFormData((prev) => ({ ...prev, baseWeeklySalary: num / mult }));
	};

	const handleBonusChange = (val: string) => {
		setDisplayBonus(val);
		const num = parseFloat(val) || 0;
		const mult = getMultiplier(formData.paymentFrequency);
		setFormData((prev) => ({ ...prev, weeklyBonus: num / mult }));
	};

	const fileInputRef = useRef<HTMLInputElement>(null);

	// Cálculo de deudas acumuladas (no editables)
	const debts = useMemo(() => {
		const loanDebt = loans
			.filter((l) => l.employeeId === employee.id && l.status === "active")
			.reduce((acc, l) => acc + l.remainingWeeks * l.weeklyInstallment, 0);

		const penalizationDebt = penalizations
			.filter((p) => p.employeeId === employee.id && p.status === "active")
			.reduce((acc, p) => acc + p.remainingWeeks * p.weeklyInstallment, 0);

		return { loanDebt, penalizationDebt };
	}, [employee.id, loans, penalizations]);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			try {
				// Comprimir la imagen automáticamente (máximo 800x800, calidad 75%)
				const compressedBase64 = await compressImage(file, {
					maxWidth: 800,
					maxHeight: 800,
					quality: 0.75,
					outputFormat: "image/jpeg",
				});

				setFormData({ ...formData, avatarUrl: compressedBase64 });
			} catch (error) {
				console.error("Error al procesar la imagen:", error);
				alert(
					"Hubo un error al procesar la imagen. Por favor intente con otra imagen."
				);
			}
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-xl"
				onClick={onClose}
			></div>
			<div className="relative bg-charcoal-lighter border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-in">
				<div className="p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
					<div className="flex justify-between items-center mb-8">
						<h2 className="text-2xl font-black text-white uppercase tracking-tighter">
							{isNew ? "Registrar Talento" : "Editar Perfil"}
						</h2>
						<button
							onClick={onClose}
							className="text-slate-500 hover:text-white transition-colors"
						>
							<span className="material-symbols-outlined">close</span>
						</button>
					</div>

					<div className="space-y-6">
						<div className="flex flex-col items-center gap-4 mb-4">
							<div
								onClick={triggerFileInput}
								className="relative group cursor-pointer"
							>
								<div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 group-hover:border-electric transition-all relative">
									<img
										src={formData.avatarUrl || DEFAULT_AVATAR}
										className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
										alt="Avatar"
									/>
									<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
										<span className="material-symbols-outlined text-white text-3xl">
											photo_camera
										</span>
									</div>
								</div>
								<div className="absolute -bottom-2 -right-2 bg-electric w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-electric/40">
									<span className="material-symbols-outlined text-white text-sm">
										edit
									</span>
								</div>
							</div>
							<input
								type="file"
								ref={fileInputRef}
								onChange={handleFileChange}
								className="hidden"
								accept="image/*"
							/>
							<p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
								Toque la imagen para cambiar la foto
							</p>
						</div>

						{/* SECCIÓN DE DEUDAS (NO EDITABLE) */}
						{!isNew && (
							<div className="bg-charcoal p-6 rounded-2xl border border-white/5 space-y-4">
								<p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
									Estado de Cuentas (Saldos Pendientes)
								</p>
								<div className="grid grid-cols-2 gap-4">
									<div className="opacity-60 bg-white/5 p-4 rounded-xl border border-white/5">
										<label className="block text-[8px] font-black text-electric uppercase tracking-widest mb-1">
											Deuda por Préstamos
										</label>
										<input
											type="text"
											value={formatCurrency(debts.loanDebt)}
											readOnly
											disabled
											className="w-full bg-transparent border-none p-0 text-white font-black text-lg focus:ring-0 cursor-not-allowed"
										/>
									</div>
									<div className="opacity-60 bg-white/5 p-4 rounded-xl border border-white/5">
										<label className="block text-[8px] font-black text-crimson uppercase tracking-widest mb-1">
											Deuda por Penalización
										</label>
										<input
											type="text"
											value={formatCurrency(debts.penalizationDebt)}
											readOnly
											disabled
											className="w-full bg-transparent border-none p-0 text-white font-black text-lg focus:ring-0 cursor-not-allowed"
										/>
									</div>
								</div>
							</div>
						)}

						<div>
							<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
								Nombre Completo
							</label>
							<input
								type="text"
								placeholder="Eje: Juan Pérez"
								value={formData.fullName}
								onChange={(e) =>
									setFormData({ ...formData, fullName: e.target.value })
								}
								className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white placeholder:text-slate-700 focus:ring-1 focus:ring-electric transition-all"
							/>
						</div>

						<div>
							<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
								Cargo / Posición
							</label>
							<input
								type="text"
								placeholder="Eje: Analista de Operaciones"
								value={formData.position}
								onChange={(e) =>
									setFormData({ ...formData, position: e.target.value })
								}
								className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white placeholder:text-slate-700 focus:ring-1 focus:ring-electric transition-all"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
									Departamento
								</label>
								<select
									value={formData.departmentId}
									onChange={(e) =>
										setFormData({ ...formData, departmentId: e.target.value })
									}
									className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white focus:ring-1 focus:ring-electric transition-all appearance-none"
								>
									<option
										value=""
										disabled
										className="bg-charcoal text-slate-500"
									>
										Seleccionar...
									</option>
									{departments.map((d) => (
										<option
											key={d.id}
											value={d.id}
											className="bg-charcoal text-white"
										>
											{d.name}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
									Fecha de Ingreso
								</label>
								<input
									type="date"
									value={formData.hireDate}
									onChange={(e) =>
										setFormData({ ...formData, hireDate: e.target.value })
									}
									className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white focus:ring-1 focus:ring-electric transition-all"
								/>
							</div>
						</div>

						<div>
							<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
								Frecuencia de Pago
							</label>
							<div className="grid grid-cols-2 gap-3">
								{(["semanal", "quincenal"] as const).map((f) => (
									<button
										key={f}
										type="button"
										onClick={() => handleFrequencyChange(f)}
										className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
											formData.paymentFrequency === f
												? "bg-electric text-white border-electric shadow-lg shadow-electric/20"
												: "bg-white/5 text-slate-500 border-white/5 hover:border-white/20"
										}`}
									>
										{f === "semanal" ? "Semanal" : "Quincenal"}
									</button>
								))}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
									Salario Base{" "}
									{formData.paymentFrequency === "quincenal"
										? "Quincenal"
										: "Semanal"}{" "}
									($)
								</label>
								<input
									type="number"
									placeholder="0.00"
									value={displaySalary}
									onChange={(e) => handleSalaryChange(e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white placeholder:text-slate-700 focus:ring-1 focus:ring-electric transition-all"
								/>
							</div>
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
									Bono{" "}
									{formData.paymentFrequency === "quincenal"
										? "Quincenal"
										: "Semanal"}{" "}
									($)
								</label>
								<input
									type="number"
									placeholder="0.00"
									value={displayBonus}
									onChange={(e) => handleBonusChange(e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white placeholder:text-slate-700 focus:ring-1 focus:ring-electric transition-all"
								/>
							</div>
						</div>

						{!isNew && (
							<div>
								<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
									Estado Laboral
								</label>
								<div className="grid grid-cols-2 gap-3">
									{(
										["Activo", "Suspendido", "Despedido", "Renunció"] as const
									).map((s) => (
										<button
											key={s}
											type="button"
											onClick={() =>
												setFormData({
													...formData,
													status: s,
													suspensionUntil:
														s === "Suspendido"
															? formData.suspensionUntil
															: undefined,
												})
											}
											className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
												formData.status === s
													? "bg-electric text-white border-electric shadow-lg shadow-electric/20"
													: "bg-white/5 text-slate-500 border-white/5 hover:border-white/20"
											}`}
										>
											{s}
										</button>
									))}
								</div>
							</div>
						)}
					</div>

					<div className="mt-10 flex gap-3">
						<button
							onClick={onClose}
							className="flex-1 h-14 rounded-xl border border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all"
						>
							Cancelar
						</button>
						<button
							onClick={() => {
								// Validation
								const errors = [];
								if (!formData.fullName?.trim()) errors.push("Nombre completo");
								if (!formData.position?.trim()) errors.push("Cargo/Posición");
								if (!formData.departmentId) errors.push("Departamento");
								if (!formData.hireDate) errors.push("Fecha de ingreso");
								if (!formData.paymentFrequency)
									errors.push("Frecuencia de pago");

								if (errors.length > 0) {
									alert(
										`Por favor complete los siguientes campos obligatorios:\n\n• ${errors.join("\n• ")}`
									);
									return;
								}

								onSave(formData);
							}}
							className="flex-1 h-14 rounded-xl bg-electric text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-electric/20 hover:bg-electric-light transition-all"
						>
							{isNew ? "Registrar Miembro" : "Guardar Cambios"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
