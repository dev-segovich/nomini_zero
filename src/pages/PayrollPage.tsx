import React from "react";
import { useData } from "../context/DataContext";
import { formatCurrency } from "../utils";
import { useOutletContext } from "react-router-dom";

const PayrollPage: React.FC = () => {
	const {
		history,
		currentCycleType,
		setCurrentCycleType,
		setSelectedWeekForDetail,
		setIsPreviewingWeek,
		stats,
	} = useData();

	return (
		<div className="space-y-8 animate-slide-in">
			<h2 className="text-4xl font-black text-titanium italic uppercase tracking-tighter">
				Archivo de Pagos
			</h2>

			<div className="flex flex-col gap-4">
				<div className="flex justify-end gap-2 px-2">
					{(["semanal", "quincenal"] as const).map((type) => (
						<button
							key={type}
							onClick={() => setCurrentCycleType(type)}
							className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
								currentCycleType === type
									? "bg-electric text-white border-electric shadow-lg shadow-electric/20"
									: "bg-white/5 text-slate-500 border-white/5 hover:border-white/10"
							}`}
						>
							{type}
						</button>
					))}
				</div>
				<div
					onClick={() => setIsPreviewingWeek(true)}
					className="bg-electric/10 p-8 rounded-3xl border border-electric/30 flex justify-between items-center cursor-pointer hover:bg-electric/20 transition-all group"
				>
					<div className="flex items-center gap-6">
						<div className="w-14 h-14 bg-electric rounded-2xl flex items-center justify-center text-white shadow-lg shadow-electric/30 group-hover:scale-110 transition-transform">
							<span className="material-symbols-outlined text-3xl">
								{currentCycleType === "semanal"
									? "calendar_view_week"
									: "calendar_month"}
							</span>
						</div>
						<div>
							<p className="text-electric text-xl font-black italic uppercase tracking-tighter">
								{currentCycleType === "semanal"
									? "Nómina Semanal"
									: "Nómina Quincenal"}
							</p>
							<p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
								Ciclo en Curso - Editable
							</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-white text-2xl font-black italic font-mono">
							{formatCurrency(stats.total)}
						</p>
						<p className="text-[9px] font-black text-electric/60 uppercase">
							Carga Proyectada ({currentCycleType})
						</p>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-4 py-4">
				<div className="h-px flex-1 bg-white/5"></div>
				<span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
					Historial de Ciclos
				</span>
				<div className="h-px flex-1 bg-white/5"></div>
			</div>

			{history.length === 0 ? (
				<div className="bg-charcoal/50 p-16 rounded-[3rem] border border-dashed border-white/10 text-center flex flex-col items-center opacity-40 animate-pulse">
					<span className="material-symbols-outlined text-6xl mb-4 text-slate-700">
						history_toggle_off
					</span>
					<p className="text-xs font-black uppercase tracking-widest text-slate-500">
						Archivo Vacío - No hay ciclos registrados
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{history.map((week) => (
						<div
							key={week.id}
							onClick={() => setSelectedWeekForDetail(week)}
							className="bg-charcoal p-8 rounded-3xl border border-white/5 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-all"
						>
							<div>
								<p className="text-titanium text-lg font-black">{week.label}</p>
								<p className="text-[10px] font-black text-slate-500 uppercase">
									{new Date(week.date).toLocaleDateString()}
								</p>
							</div>
							<p className="text-emerald text-2xl font-black">
								{formatCurrency(week.totalDisbursement)}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default PayrollPage;
