import React from "react";
import { PayrollWeek, Employee, DayStatus } from "../types";
import { formatCurrency } from "../utils";
import { DEFAULT_AVATAR, DAYS_SHORT } from "../constants";

interface WeekDetailModalProps {
	week: PayrollWeek;
	employees: Employee[];
	isExporting?: boolean;
	onClose: () => void;
	onDownload: () => void;
	onAttendanceChange?: (employeeId: string, dayIndex: number) => void;
	onExtraHoursChange?: (employeeId: string, delta: number) => void;
	onBonusChange?: (employeeId: string, amount: number) => void;
	onFinalize?: () => void;
}

export const WeekDetailModal: React.FC<WeekDetailModalProps> = ({
	week,
	employees,
	isExporting,
	onClose,
	onDownload,
	onAttendanceChange,
	onExtraHoursChange,
	onBonusChange,
	onFinalize,
}) => {
	const getDayStyle = (dayStatus: DayStatus) => {
		switch (dayStatus) {
			case "worked":
				return "bg-electric text-white shadow-lg shadow-electric/20";
			case "holiday":
				return "bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/50";
			case "absent":
			default:
				return "bg-white/5 text-slate-600 border border-white/5 hover:text-slate-400";
		}
	};

	return (
		<div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-xl"
				onClick={onClose}
			></div>

			{/* Container Principal con ID para captura PNG */}
			<div
				id="week-report-content"
				className="relative bg-charcoal-lighter border border-white/10 w-full max-w-6xl rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col animate-slide-in"
			>
				{/* Header Detalle */}
				<div className="p-8 sm:p-10 border-b border-white/5 flex justify-between items-start bg-gradient-to-br from-white/[0.03] to-transparent">
					<div>
						{!onFinalize ? (
							<div className="flex items-center gap-3 mb-2">
								<span className="bg-electric/20 text-electric px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
									Auditoría Registrada
								</span>
								<span className="text-slate-600 text-[9px] font-black uppercase tracking-widest">
									REG: {week.id.toUpperCase()}
								</span>
							</div>
						) : (
							<div className="flex items-center gap-3 mb-2">
								<span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
									Resumen de Auditoría
								</span>
							</div>
						)}
						<h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase italic">
							{week.label}
						</h2>
						{!onFinalize && (
							<p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mt-3">
								Ciclo finalizado el{" "}
								{new Date(week.date).toLocaleDateString("es-ES", {
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							</p>
						)}
					</div>
					{!isExporting && (
						<button
							onClick={onClose}
							className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90"
						>
							<span className="material-symbols-outlined">close</span>
						</button>
					)}
				</div>

				{/* Resumen de Lote */}
				<div className="grid grid-cols-2 sm:grid-cols-4 border-b border-white/5 bg-white/[0.01]">
					<div className="p-6 sm:p-8 border-r border-white/5">
						<p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
							Total Dispersado
						</p>
						<p className="text-white text-2xl font-black italic leading-none">
							{formatCurrency(week.totalDisbursement)}
						</p>
					</div>
					<div className="p-6 sm:p-8 border-r border-white/5">
						<p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
							Fuerza Laboral
						</p>
						<p className="text-white text-2xl font-black italic leading-none">
							{week.summaries.length} Miembros
						</p>
					</div>
					<div className="p-6 sm:p-8 border-r border-white/5">
						<p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
							Ticket Promedio
						</p>
						<p className="text-electric text-2xl font-black italic leading-none">
							{formatCurrency(
								week.totalDisbursement / (week.summaries.length || 1)
							)}
						</p>
					</div>
					<div className="p-6 sm:p-8 bg-emerald/5">
						<p className="text-[8px] font-black text-emerald uppercase tracking-widest mb-2">
							Estado de Bóveda
						</p>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-emerald rounded-full animate-pulse"></div>
							<p className="text-emerald text-xs font-black uppercase italic">
								Sincronizado
							</p>
						</div>
					</div>
				</div>

				{/* Desglose de Liquidación Maestro */}
				<div className="p-4 sm:p-8 bg-black/10">
					{/* Header Columnas */}
					<div className="hidden lg:grid grid-cols-12 px-6 mb-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
						<div className="col-span-3">Talento / Rol</div>
						<div className="col-span-5 text-center">
							Desglose Actuarial (Base / Faltas / Feriados / H.Extras)
						</div>
						<div className="col-span-1 text-center">Bonos</div>
						<div className="col-span-1 text-center">Deducciones</div>
						<div className="col-span-2 text-right">Neto Pagado</div>
					</div>

					<div className="space-y-4">
						{week.summaries.map((s) => {
							const emp = employees.find((e) => e.id === s.employeeId);
							return (
								<div
									key={s.employeeId}
									className="bg-charcoal p-6 rounded-[2.5rem] border border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 items-center"
								>
									{/* Perfil */}
									<div className="col-span-3">
										<div className="flex items-center gap-4 mb-3">
											<img
												src={emp?.avatarUrl || DEFAULT_AVATAR}
												className="w-10 h-10 rounded-xl object-cover grayscale border border-white/10"
											/>
											<div className="overflow-hidden">
												<p className="text-white text-xs font-black truncate">
													{s.name}
												</p>
												<p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter truncate">
													{s.department}
												</p>
											</div>
										</div>

										{onAttendanceChange && s.dailyAttendance && (
											<div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
												{s.dailyAttendance.map((day, idx) => (
													<button
														key={idx}
														onClick={() =>
															onAttendanceChange(s.employeeId, idx)
														}
														className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all active:scale-90 ${getDayStyle(day)}`}
													>
														{DAYS_SHORT[idx]}
													</button>
												))}
											</div>
										)}
									</div>

									{/* Desglose Central Extendido */}
									<div className="col-span-5 grid grid-cols-4 gap-2 px-4 border-l border-r border-white/5">
										<div className="text-center">
											<p className="text-[10px] font-black text-slate-600 uppercase mb-1">
												Base Teórica
											</p>
											<p className="text-sm font-black text-slate-300 font-mono">
												{formatCurrency(s.theoreticalBase)}
											</p>
										</div>
										<div className="text-center">
											<p className="text-[10px] font-black text-crimson uppercase mb-1">
												Faltas (
												{Math.max(
													0,
													5 -
														(s.daysWorked +
															(s.holidaysWorked - (s.weekendWorkedCount || 0)))
												)}
												)
											</p>
											<p className="text-sm font-black text-crimson/80 font-mono">
												-{formatCurrency(s.unpaidDaysAmount || 0)}
											</p>
										</div>
										<div className="text-center">
											<p className="text-[10px] font-black text-rose-400 uppercase mb-1">
												Feriados ({s.holidaysWorked})
											</p>
											<p className="text-sm font-black text-rose-400/80 font-mono">
												+{formatCurrency(s.holidayExtraPay || 0)}
											</p>
										</div>
										<div className="text-center">
											<p className="text-[10px] font-black text-electric uppercase mb-1">
												H. Extras ({s.extraHoursCount || 0})
											</p>
											{onExtraHoursChange ? (
												<div className="flex items-center justify-center gap-2">
													<button
														onClick={() => onExtraHoursChange(s.employeeId, -1)}
														className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-slate-500 hover:text-white"
													>
														<span className="material-symbols-outlined text-[10px]">
															remove
														</span>
													</button>
													<p className="text-sm font-black text-electric/80 font-mono">
														+{formatCurrency(s.extraHoursPay || 0)}
													</p>
													<button
														onClick={() => onExtraHoursChange(s.employeeId, 1)}
														className="w-5 h-5 rounded-md bg-electric/20 flex items-center justify-center text-electric hover:bg-electric hover:text-white"
													>
														<span className="material-symbols-outlined text-[10px]">
															add
														</span>
													</button>
												</div>
											) : (
												<p className="text-sm font-black text-electric/80 font-mono">
													+{formatCurrency(s.extraHoursPay || 0)}
												</p>
											)}
										</div>
									</div>

									{/* Bonos */}
									<div className="col-span-1 flex flex-col items-center justify-center">
										<p className="text-[10px] font-black text-emerald uppercase mb-1">
											Bonos
										</p>
										<p className="text-emerald text-sm font-black font-mono">
											+{formatCurrency(s.bonus)}
										</p>
									</div>

									{/* Deducciones */}
									<div className="col-span-1 flex flex-col items-center gap-1">
										{s.loanDeduction && (
											<div className="flex items-center gap-1 bg-electric/10 px-2 py-1 rounded text-[10px] font-black text-electric uppercase">
												{formatCurrency(s.loanDeduction)}
											</div>
										)}
										{s.penalizationDeduction && (
											<div className="flex items-center gap-1 bg-crimson/10 px-2 py-1 rounded text-[10px] font-black text-crimson uppercase">
												{formatCurrency(s.penalizationDeduction)}
											</div>
										)}
										{!s.loanDeduction && !s.penalizationDeduction && (
											<span className="text-[10px] font-black text-white uppercase italic">
												Limpio
											</span>
										)}
									</div>

									{/* Neto Final */}
									<div className="col-span-2 text-right">
										<div className="flex flex-col items-end">
											<p className="text-white text-2xl font-black italic font-mono tracking-tighter">
												{formatCurrency(s.total)}
											</p>
											{s.liquidation && (
												<span className="text-[7px] font-black bg-emerald text-white px-2 rounded-full uppercase">
													Cierre Liquidación
												</span>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Footer Acciones */}
				{!isExporting && (
					<div className="p-8 border-t border-white/5 bg-charcoal-lighter flex flex-col sm:flex-row gap-4">
						<button
							onClick={onDownload}
							disabled={isExporting}
							className="flex-[2] h-14 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 hover:bg-white/10"
						>
							<span className="material-symbols-outlined">image</span>
							{isExporting
								? "Procesando Imagen..."
								: "Exportar Reporte Maestro (PNG)"}
						</button>

						{onFinalize && (
							<button
								onClick={onFinalize}
								className="flex-[1.5] h-14 bg-emerald text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald/20 active:scale-95 transition-all"
							>
								<span className="material-symbols-outlined">check_circle</span>
								Cerrar Ciclo
							</button>
						)}

						<button
							onClick={onClose}
							className="flex-1 h-14 bg-white/5 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/5"
						>
							Cerrar
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
