import React, { useState, useMemo, useEffect, useRef } from "react";
import { Employee, EmployeeStatus } from "../types";
import {
	calculateLiquidation,
	formatCurrency,
	calculateSeniority,
} from "../utils";
import { DEFAULT_AVATAR } from "../constants";
import { toPng } from "html-to-image";

interface LiquidationModuleProps {
	employees: Employee[];
}

interface SimulationParams {
	baseWeeklySalary: number;
	hireDate: string;
	utilidadesDays: number;
	vacationBaseDays: number;
	unpaidWeeks: number;
}

export const LiquidationModule: React.FC<LiquidationModuleProps> = ({
	employees,
}) => {
	const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
	const [simulationType, setSimulationType] =
		useState<EmployeeStatus>("Renunció");

	const [params, setParams] = useState<SimulationParams>({
		baseWeeklySalary: 0,
		hireDate: "",
		utilidadesDays: 30,
		vacationBaseDays: 15,
		unpaidWeeks: 0,
	});

	const selectedEmp = useMemo(
		() => employees.find((e) => e.id === selectedEmpId),
		[selectedEmpId, employees]
	);

	useEffect(() => {
		if (selectedEmp) {
			setParams({
				baseWeeklySalary: selectedEmp.baseWeeklySalary,
				hireDate: selectedEmp.hireDate,
				utilidadesDays: 30,
				vacationBaseDays: 15,
				unpaidWeeks: 0,
			});
			// Resetear el tipo a Renunció al cambiar de empleado por seguridad
			setSimulationType("Renunció");
		}
	}, [selectedEmp]);

	const liquidationData = useMemo(() => {
		if (!selectedEmp) return null;
		return calculateLiquidation(
			params.baseWeeklySalary,
			params.hireDate,
			simulationType,
			params.unpaidWeeks * (params.baseWeeklySalary / 1),
			params.utilidadesDays,
			params.vacationBaseDays
		);
	}, [selectedEmp, simulationType, params]);

	const totalPassiveCost = useMemo(() => {
		return employees.reduce((acc, emp) => {
			const liq = calculateLiquidation(
				emp.baseWeeklySalary,
				emp.hireDate,
				"Renunció",
				0
			);
			return acc + (liq?.total || 0);
		}, 0);
	}, [employees]);

	const reportRef = useRef<HTMLDivElement>(null);

	const handleExportPNG = async () => {
		if (!reportRef.current || !selectedEmp) return;

		try {
			const dataUrl = await toPng(reportRef.current, {
				quality: 1.0,
				pixelRatio: 2,
				backgroundColor: "#0f1419",
			});

			const link = document.createElement("a");
			link.download = `Liquidacion_${selectedEmp.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.png`;
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error("Error al exportar:", error);
			alert(
				"Hubo un error al generar la imagen. Por favor intente nuevamente."
			);
		}
	};

	return (
		<div className="space-y-10 animate-slide-in pb-20">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
				<div>
					<h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
						Consola Actuarial
					</h2>
					<p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em] mt-2">
						Auditoría y Simulación Manual de Egresos
					</p>
				</div>
				{/* <div className="bg-crimson/10 px-8 py-4 rounded-[2rem] border border-crimson/20">
					<p className="text-[9px] font-black text-crimson uppercase tracking-widest mb-1">
						Pasivo Global (Renuncia)
					</p>
					<p className="text-white text-2xl font-black tracking-tighter italic">
						{formatCurrency(totalPassiveCost)}
					</p>
				</div> */}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
				<div className="lg:col-span-3 space-y-4">
					<h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">
						Seleccionar Sujeto
					</h4>
					<div className="space-y-3 max-h-[700px] overflow-y-auto no-scrollbar pr-2">
						{employees.map((emp) => {
							const isSelected = selectedEmpId === emp.id;
							return (
								<div
									key={emp.id}
									onClick={() => setSelectedEmpId(emp.id)}
									className={`ml-1 p-5 rounded-[1.5rem] border transition-all cursor-pointer group ${
										isSelected
											? "bg-electric border-electric shadow-2xl scale-[1.02]"
											: "bg-charcoal border-white/5 hover:border-white/20"
									}`}
								>
									<div className="flex items-center gap-4">
										<img
											src={emp.avatarUrl || DEFAULT_AVATAR}
											className={`w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] aspect-square rounded-xl object-cover border border-white/10 ${isSelected ? "grayscale-0" : "grayscale"}`}
										/>
										<div className="flex-1 overflow-hidden">
											<p
												className={`text-xs font-black truncate transition-colors ${isSelected ? "text-white" : "text-slate-200"}`}
											>
												{emp.fullName}
											</p>
											<p
												className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? "text-white/70" : "text-slate-500"}`}
											>
												{emp.position}
											</p>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="lg:col-span-9">
					{selectedEmp ? (
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-slide-in relative">
							{/* COLUMNA 1: CONFIGURACIÓN MANUAL */}
							<div className="bg-charcoal-darker border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
								<div className="absolute top-0 right-0 w-32 h-32 bg-electric/5 rounded-full blur-3xl pointer-events-none"></div>
								<div className="relative z-10">
									<div className="flex justify-between items-center mb-8">
										<h3 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
											<span className="material-symbols-outlined text-electric">
												tune
											</span>
											Variables de Cálculo
										</h3>
										<button
											type="button"
											onClick={() =>
												setParams({
													baseWeeklySalary: selectedEmp.baseWeeklySalary,
													hireDate: selectedEmp.hireDate,
													utilidadesDays: 30,
													vacationBaseDays: 15,
													unpaidWeeks: 0,
												})
											}
											className="text-[9px] font-black text-slate-500 hover:text-electric transition-colors uppercase tracking-widest"
										>
											Resetear Datos
										</button>
									</div>

									<div className="space-y-6">
										<div>
											<div className="flex justify-between mb-2">
												<label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
													Salario Base Semanal ($)
												</label>
											</div>
											<input
												type="number"
												value={params.baseWeeklySalary}
												onChange={(e) =>
													setParams({
														...params,
														baseWeeklySalary: parseFloat(e.target.value),
													})
												}
												className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-black focus:ring-1 focus:ring-electric transition-all"
											/>
										</div>

										<div>
											<div className="flex justify-between mb-2">
												<label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
													Fecha de Ingreso
												</label>
											</div>
											<input
												type="date"
												value={params.hireDate}
												onChange={(e) =>
													setParams({ ...params, hireDate: e.target.value })
												}
												className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-black focus:ring-1 focus:ring-electric transition-all"
											/>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">
													Utilidades/Año
												</label>
												<input
													type="number"
													min="15"
													max="120"
													value={params.utilidadesDays}
													onChange={(e) =>
														setParams({
															...params,
															utilidadesDays: parseInt(e.target.value),
														})
													}
													className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-black focus:ring-1 focus:ring-electric transition-all"
												/>
												<p className="text-[8px] text-slate-600 mt-1 font-bold">
													Mín: 15 días • Máx: 120 días
												</p>
											</div>
											<div>
												<label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">
													Vacaciones Base
												</label>
												<input
													type="number"
													min="15"
													max="30"
													value={params.vacationBaseDays}
													onChange={(e) =>
														setParams({
															...params,
															vacationBaseDays: parseInt(e.target.value),
														})
													}
													className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-black focus:ring-1 focus:ring-electric transition-all"
												/>
												<p className="text-[8px] text-slate-600 mt-1 font-bold">
													Mín: 15 días • Máx: 30 días
												</p>
											</div>
										</div>

										<div>
											<label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">
												Semanas Adeudadas
											</label>
											<input
												type="number"
												value={params.unpaidWeeks}
												onChange={(e) =>
													setParams({
														...params,
														unpaidWeeks: parseFloat(e.target.value),
													})
												}
												className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-black focus:ring-1 focus:ring-electric transition-all"
											/>
										</div>
									</div>
								</div>
							</div>

							{/* COLUMNA 2: RESULTADOS EN TIEMPO REAL */}
							<div ref={reportRef} className="flex flex-col gap-6">
								<div className="bg-charcoal p-8 rounded-[2.5rem] border border-white/5 flex-1 relative overflow-hidden">
									<div className="absolute top-0 right-0 w-32 h-32 bg-crimson/5 rounded-full blur-3xl pointer-events-none"></div>

									<div className="relative z-10 flex flex-col h-full">
										<div className="flex justify-between items-center mb-8">
											<p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
												Estado del Egreso
											</p>
											<div className="flex bg-charcoal-darker p-1 rounded-xl border border-white/10 relative z-20">
												{(["Renunció", "Despedido"] as EmployeeStatus[]).map(
													(type) => (
														<button
															key={type}
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																setSimulationType(type);
															}}
															className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
																simulationType === type
																	? "bg-crimson text-white shadow-lg scale-105"
																	: "text-slate-600 hover:text-white"
															}`}
														>
															{type}
														</button>
													)
												)}
											</div>
										</div>

										<div className="space-y-4 flex-1">
											<div className="flex justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
												<span className="text-[10px] font-bold text-slate-400 uppercase">
													Prestaciones Sociales
												</span>
												<span className="text-white font-black italic">
													{formatCurrency(liquidationData?.severancePay || 0)}
												</span>
											</div>
											<div className="flex justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
												<span className="text-[10px] font-bold text-slate-400 uppercase">
													Vacaciones Proporcionales
												</span>
												<span className="text-white font-black italic">
													{formatCurrency(liquidationData?.vacationPay || 0)}
												</span>
											</div>
											<div className="flex justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
												<span className="text-[10px] font-bold text-slate-400 uppercase">
													Utilidades Proporcionales
												</span>
												<span className="text-white font-black italic">
													{formatCurrency(liquidationData?.utilidadesPay || 0)}
												</span>
											</div>
											{simulationType === "Despedido" && (
												<div className="flex justify-between p-4 bg-crimson/10 border border-crimson/20 rounded-2xl animate-pulse">
													<span className="text-[10px] font-black text-crimson uppercase italic">
														Indemnización (Art. 92)
													</span>
													<span className="text-white font-black italic">
														+
														{formatCurrency(liquidationData?.indemnityPay || 0)}
													</span>
												</div>
											)}
											<div className="flex justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
												<span className="text-[10px] font-bold text-slate-400 uppercase">
													Semanas Pendientes
												</span>
												<span className="text-white font-black italic">
													{formatCurrency(liquidationData?.weeksOwed || 0)}
												</span>
											</div>
										</div>

										<div className="mt-10 pt-6 border-t border-white/10 text-center">
											<p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">
												Neto a Liquidar
											</p>
											<p className="text-white text-6xl font-black tracking-tighter italic">
												{formatCurrency(liquidationData?.total || 0)}
											</p>
										</div>
									</div>
								</div>

								<button
									type="button"
									onClick={handleExportPNG}
									className="w-full h-16 bg-white text-charcoal-darker rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-emerald hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
								>
									<span className="material-symbols-outlined">description</span>
									Generar Reporte de Simulación
								</button>
							</div>
						</div>
					) : (
						<div className="h-[600px] bg-charcoal-darker border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center p-20 text-center opacity-30">
							<span className="material-symbols-outlined text-8xl mb-6 text-slate-700">
								query_stats
							</span>
							<p className="text-lg font-black uppercase tracking-widest text-slate-500">
								Seleccione un miembro para iniciar auditoría
							</p>
							<p className="text-xs font-bold mt-2 text-slate-600 italic">
								Podrá modificar salarios y fechas para proyectar escenarios.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* SECCIÓN DE INSTRUCTIVO */}
			<div className="mt-16 bg-charcoal-darker border border-white/10 rounded-[2.5rem] p-10 animate-slide-in">
				<div className="flex items-center gap-4 mb-8">
					<div className="w-14 h-14 bg-electric/10 rounded-2xl flex items-center justify-center">
						<span className="material-symbols-outlined text-electric text-3xl">
							school
						</span>
					</div>
					<div>
						<h3 className="text-white text-2xl font-black uppercase tracking-tight">
							Guía de Liquidación Laboral (LOTTT)
						</h3>
						<p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
							Marco Legal y Fórmulas de Cálculo
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* COLUMNA 1: CONCEPTOS BÁSICOS */}
					<div className="space-y-6">
						<div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
							<h4 className="text-electric text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">info</span>
								¿Qué es la Liquidación?
							</h4>
							<p className="text-slate-400 text-xs leading-relaxed">
								Es el cálculo final de todas las deudas laborales al terminar un
								contrato de trabajo, incluyendo salarios pendientes, vacaciones
								no disfrutadas, utilidades y prestaciones sociales. Debe pagarse
								el{" "}
								<strong className="text-white">
									mismo día de finalización
								</strong>{" "}
								del contrato.
							</p>
						</div>

						<div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
							<h4 className="text-emerald text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">
									calculate
								</span>
								Salario Integral
							</h4>
							<p className="text-slate-400 text-xs leading-relaxed mb-3">
								Base de cálculo para TODOS los conceptos de liquidación. Se
								compone de:
							</p>
							<div className="space-y-2 text-[11px]">
								<div className="flex items-start gap-2">
									<span className="text-emerald font-black">•</span>
									<span className="text-slate-300">
										<strong>Salario Base:</strong> Salario semanal / 7 días
									</span>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-emerald font-black">•</span>
									<span className="text-slate-300">
										<strong>Alícuota Utilidades:</strong> (Días/año × Salario
										mensual) ÷ 365
									</span>
								</div>
								<div className="flex items-start gap-2">
									<span className="text-emerald font-black">•</span>
									<span className="text-slate-300">
										<strong>Alícuota Bono Vacacional:</strong> (7 días × Salario
										mensual) ÷ 365
									</span>
								</div>
							</div>
						</div>

						<div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
							<h4 className="text-amber-500 text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">gavel</span>
								Art. 92 LOTTT - Indemnización
							</h4>
							<p className="text-slate-400 text-xs leading-relaxed mb-3">
								Solo aplica en{" "}
								<strong className="text-crimson">
									despidos injustificados
								</strong>
								:
							</p>
							<div className="space-y-2 text-[11px]">
								<div className="flex justify-between px-3 py-2 bg-white/[0.02] rounded-lg">
									<span className="text-slate-400">Menos de 3 meses:</span>
									<strong className="text-white">15 días</strong>
								</div>
								<div className="flex justify-between px-3 py-2 bg-white/[0.02] rounded-lg">
									<span className="text-slate-400">3 a 6 meses:</span>
									<strong className="text-white">30 días</strong>
								</div>
								<div className="flex justify-between px-3 py-2 bg-white/[0.02] rounded-lg">
									<span className="text-slate-400">6 meses a 1 año:</span>
									<strong className="text-white">45 días</strong>
								</div>
								<div className="flex justify-between px-3 py-2 bg-crimson/10 border border-crimson/20 rounded-lg">
									<span className="text-crimson font-bold">1 año o más:</span>
									<strong className="text-white">
										60 + (30 × años adicionales)
									</strong>
								</div>
							</div>
						</div>
					</div>

					{/* COLUMNA 2: FÓRMULAS DETALLADAS */}
					<div className="space-y-6">
						<div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
							<h4 className="text-blue-400 text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">
									account_balance
								</span>
								Prestaciones Sociales (Art. 141-143)
							</h4>
							<div className="space-y-3 text-[11px]">
								<div>
									<p className="text-slate-400 mb-2">
										<strong className="text-white">Primer año:</strong>
									</p>
									<div className="bg-white/[0.02] px-3 py-2 rounded-lg font-mono text-emerald">
										5 días/mes × Meses trabajados
									</div>
								</div>
								<div>
									<p className="text-slate-400 mb-2">
										<strong className="text-white">Años subsiguientes:</strong>
									</p>
									<div className="bg-white/[0.02] px-3 py-2 rounded-lg font-mono text-emerald">
										60 días + (2 días/mes × Meses adicionales)
									</div>
								</div>
								<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
									<p className="text-amber-500 font-bold">
										Garantía mínima: 30 días/año
									</p>
								</div>
							</div>
						</div>

						<div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
							<h4 className="text-purple-400 text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">
									beach_access
								</span>
								Vacaciones (Art. 190-195)
							</h4>
							<div className="space-y-3 text-[11px]">
								<div>
									<p className="text-slate-400 mb-2">
										Incluye vacaciones NO disfrutadas + bono vacacional:
									</p>
									<div className="bg-white/[0.02] px-3 py-2 rounded-lg">
										<p className="text-white mb-1">
											• <strong>Vacaciones:</strong> 15 días + 1 día/año (máx.
											30)
										</p>
										<p className="text-white">
											• <strong>Bono:</strong> 7 días + 1 día/año (máx. 21)
										</p>
									</div>
								</div>
								<div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
									<p className="text-purple-400 font-bold">
										Se acumulan POR AÑO completo trabajado
									</p>
								</div>
							</div>
						</div>

						<div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
							<h4 className="text-yellow-400 text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">
									payments
								</span>
								Utilidades (Art. 131-140)
							</h4>
							<div className="space-y-3 text-[11px]">
								<div className="bg-white/[0.02] px-3 py-2 rounded-lg">
									<p className="text-slate-400 mb-1">Mínimo legal:</p>
									<p className="text-emerald font-bold">15 días/año</p>
								</div>
								<div className="bg-white/[0.02] px-3 py-2 rounded-lg">
									<p className="text-slate-400 mb-1">Máximo legal:</p>
									<p className="text-crimson font-bold">120 días (4 meses)</p>
								</div>
								<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
									<p className="text-yellow-400 font-bold">
										Cálculo proporcional al año en curso
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* NOTA IMPORTANTE */}
				<div className="mt-8 bg-electric/5 border border-electric/20 rounded-2xl p-6">
					<div className="flex items-start gap-4">
						<span className="material-symbols-outlined text-electric text-3xl">
							verified
						</span>
						<div>
							<h5 className="text-electric text-sm font-black uppercase tracking-widest mb-2">
								Principio de Favorabilidad LOTTT
							</h5>
							<p className="text-slate-400 text-xs leading-relaxed">
								La Ley Orgánica del Trabajo establece que en caso de duda sobre
								la aplicación de normas,
								<strong className="text-white">
									{" "}
									siempre se debe aplicar la más favorable al trabajador
								</strong>
								. Todas las fórmulas en este sistema están diseñadas para
								cumplir con este principio constitucional.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
