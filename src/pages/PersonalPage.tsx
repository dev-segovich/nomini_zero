import React from "react";
import { useData } from "../context/DataContext";
import { EmployeeCard } from "../components/EmployeeCard";
import { useOutletContext } from "react-router-dom";
import employeesService from "../services/employees.service";

const PersonalPage: React.FC = () => {
	const {
		employees,
		setEmployees,
		deptFilter,
		setDeptFilter,
		departments,
		suspensions,
		loans,
		penalizations,
		handleStatusChange,
		setNotification,
	} = useData();

	const { setIsAddingEmployee, setEditingEmployee } = useOutletContext() as any;
	const [showFilters, setShowFilters] = React.useState(false);
	const [debtFilterType, setDebtFilterType] = React.useState<
		"all" | "loan" | "penalization" | "debt"
	>("all");

	const filteredEmployees = employees.filter((e) => {
		const matchesDept =
			deptFilter === "Todos" || e.department?.name === deptFilter;
		if (!matchesDept) return false;

		const hasLoan = loans.some(
			(l) => l.employeeId === e.id && l.status === "active"
		);
		const hasPenalization = penalizations.some(
			(p) => p.employeeId === e.id && p.status === "active"
		);

		if (debtFilterType === "loan") return hasLoan;
		if (debtFilterType === "penalization") return hasPenalization;
		if (debtFilterType === "debt") return hasLoan || hasPenalization;

		return true;
	});

	return (
		<div className="space-y-8 animate-slide-in">
			<div className="flex justify-between items-center">
				<h2 className="text-4xl font-black text-titanium italic uppercase tracking-tighter">
					Bóveda de Talento
				</h2>
				<div className="flex gap-3">
					<button
						onClick={() => setShowFilters(!showFilters)}
						className={`h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 transition-all ${
							showFilters
								? "bg-white/10 text-white border border-white/20"
								: "bg-charcoal text-slate-400 border border-white/5 hover:border-white/10"
						}`}
					>
						<span className="material-symbols-outlined">filter_list</span>
						{showFilters ? "Cerrar" : "Filtros"}
					</button>
					<button
						onClick={() => setIsAddingEmployee(true)}
						className="h-14 px-6 bg-electric text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-lg shadow-electric/20"
					>
						<span className="material-symbols-outlined">person_add</span> Nuevo
					</button>
				</div>
			</div>

			{/* PANEL DE FILTROS EXPANDIBLE */}
			{showFilters && (
				<div className="bg-charcoal/50 border border-white/5 rounded-[2.5rem] p-8 space-y-8 animate-slide-in overflow-hidden shadow-2xl">
					<div className="space-y-4">
						<p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
							Filtrar por Departamento
						</p>
						<div className="flex flex-wrap gap-2">
							<button
								onClick={() => setDeptFilter("Todos")}
								className={`px-5 h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
									deptFilter === "Todos"
										? "bg-electric text-white border-electric shadow-lg shadow-electric/20"
										: "bg-white/5 text-slate-500 border-white/5 hover:border-white/10"
								}`}
							>
								Todos
							</button>
							{departments.map((dept) => (
								<button
									key={dept.id}
									onClick={() => setDeptFilter(dept.name)}
									className={`px-5 h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
										deptFilter === dept.name
											? "bg-electric text-white border-electric shadow-lg shadow-electric/20"
											: "bg-white/5 text-slate-500 border-white/5 hover:border-white/10"
									}`}
								>
									{dept.name}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-4">
						<p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
							Estatus de Compromisos
						</p>
						<div className="flex flex-wrap gap-2">
							{[
								{ id: "all", label: "Cualquier Estado", icon: "group" },
								{
									id: "loan",
									label: "Con Préstamos Activos",
									icon: "payments",
								},
								{
									id: "penalization",
									label: "Con Sanciones Vigentes",
									icon: "gavel",
								},
								{
									id: "debt",
									label: "Con Deuda (Cualquiera)",
									icon: "account_balance",
								},
							].map((f) => (
								<button
									key={f.id}
									onClick={() => setDebtFilterType(f.id as any)}
									className={`px-5 h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-3 ${
										debtFilterType === f.id
											? "bg-electric text-white border-electric shadow-lg shadow-electric/20"
											: "bg-white/5 text-slate-500 border-white/5 hover:border-white/10"
									}`}
								>
									<span className="material-symbols-outlined text-base">
										{f.icon}
									</span>
									{f.label}
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			{employees.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 px-10 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] text-center animate-slide-in">
					<div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
						<span className="material-symbols-outlined text-5xl text-slate-700">
							group_off
						</span>
					</div>
					<h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
						La Bóveda está Vacía
					</h3>
					<p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
						Aún no has registrado ningún talento en el sistema.
					</p>
					<button
						onClick={() => setIsAddingEmployee(true)}
						className="h-14 px-10 bg-electric text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-electric/20 hover:scale-105 transition-all"
					>
						Registrar Mi Primer Talento
					</button>
				</div>
			) : (
				<>
					{filteredEmployees.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 px-10 bg-white/[0.01] border border-dashed border-white/10 rounded-[3rem] text-center animate-fade-in">
							<span className="material-symbols-outlined text-4xl text-slate-700 mb-4">
								search_off
							</span>
							<p className="text-slate-500 text-xs font-black uppercase tracking-widest">
								No hay coincidencias para estos filtros
							</p>
							<button
								onClick={() => {
									setDeptFilter("Todos");
									setDebtFilterType("all");
								}}
								className="mt-6 text-electric text-[10px] font-black uppercase tracking-widest underline"
							>
								Restablecer Búsqueda
							</button>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{filteredEmployees.map((emp) => (
								<EmployeeCard
									key={emp.id}
									employee={emp}
									status={emp.status || "Activo"}
									suspensionEndDate={suspensions[emp.id]}
									loanDebt={loans
										.filter(
											(l) => l.employeeId === emp.id && l.status === "active"
										)
										.reduce(
											(acc, l) => acc + l.remainingWeeks * l.weeklyInstallment,
											0
										)}
									penalizationDebt={penalizations
										.filter(
											(p) => p.employeeId === emp.id && p.status === "active"
										)
										.reduce(
											(acc, p) => acc + p.remainingWeeks * p.weeklyInstallment,
											0
										)}
									onStatusChange={(s) => handleStatusChange(emp.id, s)}
									onCardClick={() => setEditingEmployee(emp)}
									onDelete={async (id) => {
										try {
											await employeesService.remove(id);
											setEmployees((prev) => prev.filter((e) => e.id !== id));
											setNotification("Registro eliminado.");
										} catch (err) {
											console.error("Error deleting employee:", err);
											setNotification("Error al eliminar registro.");
										}
									}}
								/>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default PersonalPage;
