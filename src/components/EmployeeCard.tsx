import React, { useState, useRef, useEffect } from "react";
import { Employee, EmployeeStatus } from "../types";
import { DAYS_SHORT, DEFAULT_AVATAR } from "../constants";
import {
	calculateLiquidation,
	formatCurrency,
	calculateSeniority,
} from "../utils";

interface EmployeeCardProps {
	employee: Employee;
	status: EmployeeStatus;
	suspensionEndDate?: string;
	onStatusChange: (status: EmployeeStatus) => void;
	onCardClick: () => void;
	onDelete: (id: string) => void;
	loanDebt?: number;
	penalizationDebt?: number;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
	employee,
	status,
	suspensionEndDate,
	onStatusChange,
	onCardClick,
	onDelete,
	loanDebt = 0,
	penalizationDebt = 0,
}) => {
	const [showContextMenu, setShowContextMenu] = useState(false);
	const contextMenuRef = useRef<HTMLDivElement>(null);

	const { years, months, days } = calculateSeniority(employee.hireDate);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				contextMenuRef.current &&
				!contextMenuRef.current.contains(event.target as Node)
			) {
				setShowContextMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div
			className={`transition-all duration-500 rounded-[2.5rem] p-7 group relative shadow-lg hover:shadow-2xl cursor-pointer border ${
				showContextMenu ? "z-[50]" : "z-10"
			} ${
				status === "Activo"
					? "bg-charcoal border-white/5"
					: status === "Suspendido"
						? "bg-charcoal border-amber-500/20"
						: "bg-charcoal/40 border-crimson/20"
			}`}
			onClick={(e) => {
				if (contextMenuRef.current?.contains(e.target as Node)) return;
				onCardClick();
			}}
		>
			<div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
				<div className="absolute top-0 right-0 w-32 h-32 bg-electric/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-electric/10 transition-all"></div>
			</div>

			<div className="flex justify-between items-start relative z-30">
				<div
					className={`flex gap-5 ${status !== "Activo" && status !== "Suspendido" ? "grayscale opacity-60" : ""}`}
				>
					<div className="relative w-16 h-16 flex-shrink-0">
						<img
							src={employee.avatarUrl || DEFAULT_AVATAR}
							alt={employee.fullName}
							className={`w-full h-full rounded-[1.25rem] border border-white/10 object-cover shadow-inner ${status === "Suspendido" ? "grayscale-0" : ""}`}
						/>
						{status !== "Activo" && (
							<div
								className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-charcoal shadow-lg ${status === "Suspendido" ? "bg-amber-500" : "bg-crimson"}`}
							>
								<span className="material-symbols-outlined text-[12px] text-white">
									{status === "Suspendido" ? "pause" : "block"}
								</span>
							</div>
						)}
					</div>
					<div>
						<h3 className="text-white text-xl font-black tracking-tighter leading-none mb-1">
							{employee.fullName}
						</h3>
						<div className="flex items-center gap-2">
							<span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
								{employee.position}
							</span>
							<span className="w-1 h-1 rounded-full bg-slate-700"></span>
							<span className="text-electric text-[10px] font-black uppercase tracking-widest">
								{employee.department?.name}
							</span>
						</div>
						<div className="mt-4 space-y-2">
							<div className="flex flex-wrap items-center gap-2 w-[110%]">
								<div className="flex-shrink-0 flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full w-fit border border-white/5 h-8">
									<span className="material-symbols-outlined text-[14px] text-electric">
										history
									</span>
									<span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter whitespace-nowrap">
										{years}a {months}m {days}d
									</span>
								</div>

								{loanDebt > 0 && (
									<div className="flex-shrink-0 bg-electric/10 border border-electric/20 px-3 py-1 rounded-2xl flex items-center gap-2 h-8">
										<span className="material-symbols-outlined text-[14px] text-electric">
											payments
										</span>
										<div className="flex flex-col">
											<span className="text-[7px] font-black text-electric uppercase tracking-[0.1em] leading-none whitespace-nowrap">
												Préstamo
											</span>
											<span className="text-white text-[10px] font-black leading-tight whitespace-nowrap">
												{formatCurrency(loanDebt)}
											</span>
										</div>
									</div>
								)}
								{penalizationDebt > 0 && (
									<div className="flex-shrink-0 bg-crimson/10 border border-crimson/20 px-3 py-1 rounded-2xl flex items-center gap-2 h-8">
										<span className="material-symbols-outlined text-[14px] text-crimson">
											gavel
										</span>
										<div className="flex flex-col">
											<span className="text-[7px] font-black text-crimson uppercase tracking-[0.1em] leading-none whitespace-nowrap">
												Sanción
											</span>
											<span className="text-white text-[10px] font-black leading-tight whitespace-nowrap">
												{formatCurrency(penalizationDebt)}
											</span>
										</div>
									</div>
								)}

								{loanDebt === 0 && penalizationDebt === 0 && (
									<div className="flex-shrink-0 bg-emerald/10 border border-emerald/20 px-3 py-1 rounded-2xl flex items-center gap-2 h-8">
										<span className="material-symbols-outlined text-[14px] text-emerald">
											verified_user
										</span>
										<span className="text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
											Solvente
										</span>
									</div>
								)}
							</div>

							{status === "Suspendido" && suspensionEndDate && (
								<div className="flex-shrink-0 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-2xl flex items-center gap-2 h-8 w-fit animate-slide-in">
									<span className="material-symbols-outlined text-[14px] text-amber-500">
										event_repeat
									</span>
									<div className="flex flex-col">
										<span className="text-[7px] font-black text-amber-500 uppercase tracking-[0.1em] leading-none whitespace-nowrap">
											Retorno
										</span>
										<span className="text-white text-[10px] font-black leading-tight whitespace-nowrap">
											{new Date(suspensionEndDate).toLocaleDateString()}
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="relative" ref={contextMenuRef}>
					<button
						onClick={(e) => {
							e.stopPropagation();
							setShowContextMenu(!showContextMenu);
						}}
						className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
							showContextMenu
								? "bg-electric text-white"
								: "bg-white/5 text-slate-500 hover:bg-white/10"
						}`}
					>
						<span className="material-symbols-outlined text-2xl">
							more_horiz
						</span>
					</button>

					{showContextMenu && (
						<div
							className="absolute right-0 mt-3 w-60 bg-charcoal-lighter/95 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden py-3 backdrop-blur-2xl animate-slide-in pointer-events-auto"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="px-5 py-2 mb-2">
								<p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
									Gestión de Estado
								</p>
							</div>
							{(
								[
									"Activo",
									"Suspendido",
									"Despedido",
									"Renunció",
								] as EmployeeStatus[]
							).map((s) => (
								<button
									key={s}
									onClick={(e) => {
										e.stopPropagation();
										onStatusChange(s);
										setShowContextMenu(false);
									}}
									className={`w-full px-5 py-4 text-left text-sm font-bold flex items-center justify-between group/item transition-all ${
										status === s
											? "text-electric bg-electric/5"
											: "text-slate-400 hover:bg-white/5 hover:text-white"
									}`}
								>
									<div className="flex items-center gap-4">
										<div
											className={`w-2.5 h-2.5 rounded-full shadow-sm ${
												s === "Activo"
													? "bg-emerald shadow-emerald/50"
													: s === "Suspendido"
														? "bg-amber-500 shadow-amber-500/50"
														: "bg-crimson shadow-crimson/50"
											}`}
										></div>
										{s}
									</div>
									{status === s && (
										<span className="material-symbols-outlined text-sm">
											check_circle
										</span>
									)}
								</button>
							))}

							<div className="my-2 border-t border-white/5"></div>
							<button
								onClick={(e) => {
									e.stopPropagation();
									if (
										confirm("¿Está seguro de que desea eliminar este registro?")
									) {
										onDelete(employee.id);
									}
									setShowContextMenu(false);
								}}
								className="w-full px-5 py-4 text-left text-sm font-bold flex items-center gap-4 text-crimson hover:bg-crimson/10 transition-all"
							>
								<span className="material-symbols-outlined text-xl">
									delete
								</span>
								Eliminar Registro
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
