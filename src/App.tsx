import React, { useState, useMemo, useEffect } from "react";
import { toPng } from "html-to-image";
import { DEPARTMENTS as INITIAL_DEPARTMENTS, MOCK_HISTORY } from "./constants";
import {
	Employee,
	EmployeeStatus,
	AttendanceRecord,
	StatusRecord,
	FinalSummary,
	PayrollWeek,
	DayStatus,
	Loan,
	NotificationSettings,
	Penalization,
	SuspensionRecord,
	DeptObj,
} from "./types";
import departmentsService from "./services/departments.service";
import employeesService from "./services/employees.service";
import { EmployeeCard } from "./components/EmployeeCard";
import { DashboardModule } from "./components/DashboardModule";
import { EditEmployeeModal } from "./components/EditEmployeeModal";
import { SettingsMenu } from "./components/SettingsMenu";
import { LoansModule } from "./components/LoansModule";
import { PenalizationsModule } from "./components/PenalizationsModule";
import { WeekDetailModal } from "./components/WeekDetailModal";
import { LiquidationModule } from "./components/LiquidationModule";
import {
	calculateLiquidation,
	formatCurrency,
	generateId,
	isVenezuelanHoliday,
	getCurrentWeekDates,
} from "./utils";

import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

type Tab =
	| "TABLERO"
	| "PERSONAL"
	| "PAGOS"
	| "PRESTAMOS"
	| "PENALIZACION"
	| "LIQUIDACION";

const App: React.FC = () => {
	const { user, logout, isLoading } = useAuth();
	const [authView, setAuthView] = useState<"login" | "register">("login");
	const [activeTab, setActiveTab] = useState<Tab>("TABLERO");

	const [employees, setEmployees] = useState<Employee[]>([]);
	const [departments, setDepartments] = useState<DeptObj[]>([]);

	useEffect(() => {
		if (user) {
			departmentsService
				.getAll()
				.then((data) => {
					setDepartments(data);
				})
				.catch((err) => console.error("Error fetching departments:", err));

			employeesService
				.getAll()
				.then((data) => {
					setEmployees(data);
				})
				.catch((err) => console.error("Error fetching employees:", err));
		}
	}, [user]);

	const [loans, setLoans] = useState<Loan[]>([]);
	const [penalizations, setPenalizations] = useState<Penalization[]>([]);
	const [notification, setNotification] = useState<string | null>(null);
	const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
	const [suspendingEmployeeId, setSuspendingEmployeeId] = useState<
		string | null
	>(null);
	const [isAddingEmployee, setIsAddingEmployee] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [settingsInitialView, setSettingsInitialView] = useState<
		"main" | "departments" | "security" | "notifications"
	>("main");
	const [selectedWeekForDetail, setSelectedWeekForDetail] =
		useState<PayrollWeek | null>(null);
	const [theme, setTheme] = useState<"light" | "dark">("dark");
	const [isExporting, setIsExporting] = useState(false);

	const [extraHours, setExtraHours] = useState<Record<string, number>>({});
	const [suspensions, setSuspensions] = useState<SuspensionRecord>({});

	const [notificationSettings, setNotificationSettings] =
		useState<NotificationSettings>({
			loans: true,
			payroll: true,
			attendance: true,
			security: true,
			soundType: "modern",
		});

	useEffect(() => {
		const html = document.documentElement;
		if (theme === "dark") {
			html.classList.add("dark");
		} else {
			html.classList.remove("dark");
		}
	}, [theme]);

	// Reactivación automática de suspendidos
	useEffect(() => {
		const checkSuspensions = () => {
			const now = new Date();
			let changed = false;
			const newSuspensions = { ...suspensions };

			setEmployees((prevStatuses) => {
				const newStatuses = [...prevStatuses];
				let anyChanged = false;

				newStatuses.forEach((emp, idx) => {
					if (emp.status === "Suspendido") {
						const endDate = new Date(suspensions[emp.id]);
						if (now >= endDate) {
							// For simplicity we update locally, but in a real app check if we need to call backend
							// or let the backend handle this logic
							newStatuses[idx] = { ...emp, status: "Activo" };
							delete newSuspensions[emp.id];
							changed = true;
							anyChanged = true;
						}
					}
				});

				if (anyChanged) {
					setSuspensions(newSuspensions);
					return newStatuses;
				}
				return prevStatuses;
			});
		};

		const interval = setInterval(checkSuspensions, 5000);
		return () => clearInterval(interval);
	}, [suspensions]);

	const [attendance, setAttendance] = useState<AttendanceRecord>({});

	useEffect(() => {
		if (employees.length > 0) {
			const weekDates = getCurrentWeekDates();
			const records: AttendanceRecord = {};
			employees.forEach((emp) => {
				const defaultWeek: DayStatus[] = weekDates.map((date, idx) => {
					if (idx === 6) return "absent";
					if (isVenezuelanHoliday(date)) return "holiday";
					return "worked";
				});
				records[emp.id] = defaultWeek;
			});
			setAttendance(records);
		}
	}, [employees]);

	const [history, setHistory] = useState<PayrollWeek[]>(MOCK_HISTORY);

	useEffect(() => {
		if (notification) {
			const timer = setTimeout(() => setNotification(null), 4000);
			return () => clearTimeout(timer);
		}
	}, [notification]);

	const stats = useMemo(() => {
		let total = 0;
		let activeCount = 0;
		let inactiveCount = 0;
		let totalDaysWorked = 0;
		let totalPotentialDays = 0;

		employees.forEach((emp) => {
			const status = emp.status || "Activo";

			const dailyRate = emp.baseWeeklySalary / 6;
			const hourlyRate = dailyRate / 8;
			const extraHourRate = hourlyRate * 1.5;
			const empAttendance = attendance[emp.id] || Array(7).fill("absent");
			const empExtraHours = extraHours[emp.id] || 0;

			const basePay = empAttendance.reduce((acc, day) => {
				if (day === "worked") {
					totalDaysWorked++;
					return acc + dailyRate;
				}
				if (day === "holiday") {
					totalDaysWorked++;
					return acc + dailyRate * 2;
				}
				return acc;
			}, 0);

			const extraPay = empExtraHours * extraHourRate;
			totalPotentialDays += 6;

			if (status === "Activo") {
				activeCount++;
				const activeLoan = loans.find(
					(l) =>
						l.employeeId === emp.id &&
						l.status === "active" &&
						l.remainingWeeks > 0
				);
				const activePenalization = penalizations.filter(
					(p) =>
						p.employeeId === emp.id &&
						p.status === "active" &&
						p.remainingWeeks > 0
				);
				const loanDeduction = activeLoan ? activeLoan.weeklyInstallment : 0;
				const penalDeduction = activePenalization.reduce(
					(acc, p) => acc + p.weeklyInstallment,
					0
				);
				total +=
					basePay + extraPay + emp.weeklyBonus - loanDeduction - penalDeduction;
			} else if (status === "Suspendido") {
				total += 0;
			} else {
				inactiveCount++;
				const liq = calculateLiquidation(
					emp.baseWeeklySalary,
					emp.hireDate,
					status,
					basePay
				);
				total += liq?.total || 0;
			}
		});

		const turnoverRate = (inactiveCount / (employees.length || 1)) * 100;

		return {
			total,
			activeCount,
			attendanceRate:
				totalPotentialDays > 0
					? (totalDaysWorked / totalPotentialDays) * 100
					: 0,
			turnoverRate,
		};
	}, [employees, attendance, loans, penalizations, extraHours]);

	const handleAttendanceCycle = (empId: string, dayIdx: number) => {
		setAttendance((prev) => {
			const current = [...(prev[empId] || Array(7).fill("absent"))];
			const status = current[dayIdx];
			let nextStatus: DayStatus =
				status === "absent"
					? "worked"
					: status === "worked"
						? "holiday"
						: "absent";
			current[dayIdx] = nextStatus;
			return { ...prev, [empId]: current };
		});
	};

	const handleUpdateExtraHours = (empId: string, delta: number) => {
		setExtraHours((prev) => ({
			...prev,
			[empId]: Math.max(0, (prev[empId] || 0) + delta),
		}));
	};

	const handleStatusChange = async (
		empId: string,
		newStatus: EmployeeStatus
	) => {
		const emp = employees.find((e) => e.id === empId);
		if (!emp) return;

		if (newStatus === "Suspendido") {
			setSuspendingEmployeeId(empId);
		} else {
			try {
				if (suspensions[empId]) {
					const newSuspensions = { ...suspensions };
					delete newSuspensions[empId];
					setSuspensions(newSuspensions);
				}
				const updated = await employeesService.update(empId, {
					...emp,
					status: newStatus,
				});
				setEmployees((prev) => prev.map((e) => (e.id === empId ? updated : e)));
				setNotification(
					`Estado de ${emp.fullName} actualizado a ${newStatus}.`
				);
			} catch (err) {
				console.error("Error updating status:", err);
				setNotification("Error al actualizar estado.");
			}
		}
	};

	const confirmSuspension = async (days: number) => {
		if (!suspendingEmployeeId) return;
		const emp = employees.find((e) => e.id === suspendingEmployeeId);
		if (!emp) return;

		const endDate = new Date();
		endDate.setDate(endDate.getDate() + days);

		try {
			const updated = await employeesService.update(suspendingEmployeeId, {
				...emp,
				status: "Suspendido",
			});
			setSuspensions((prev) => ({
				...prev,
				[suspendingEmployeeId]: endDate.toISOString(),
			}));
			setEmployees((prev) =>
				prev.map((e) => (e.id === suspendingEmployeeId ? updated : e))
			);
			setNotification(
				`Sanción aplicada: Retorno el ${endDate.toLocaleDateString()}.`
			);
		} catch (err) {
			console.error("Error suspending employee:", err);
			setNotification("Error al aplicar suspensión.");
		}
		setSuspendingEmployeeId(null);
	};

	const finalizeWeek = () => {
		const updatedLoans = [...loans];
		const updatedPenalizations = [...penalizations];

		const finalSummaries: FinalSummary[] = employees.map((emp) => {
			const status = emp.status || "Activo";
			const theoreticalBase = emp.baseWeeklySalary;
			const dailyRate = theoreticalBase / 6;
			const hourlyRate = dailyRate / 8;
			const extraHourRate = hourlyRate * 1.5;
			const empAttendance = attendance[emp.id] || Array(7).fill("absent");
			const empExtraHours = extraHours[emp.id] || 0;

			const daysWorked = empAttendance.filter((d) => d === "worked").length;
			const holidaysWorked = empAttendance.filter(
				(d) => d === "holiday"
			).length;
			const daysAbsent = 6 - (daysWorked + holidaysWorked);

			const unpaidDaysAmount = Math.max(0, daysAbsent * dailyRate);
			const holidayExtraPay = holidaysWorked * dailyRate;
			const extraHoursPay = empExtraHours * extraHourRate;

			const basePay =
				status === "Suspendido"
					? 0
					: theoreticalBase - unpaidDaysAmount + holidayExtraPay;

			const liq =
				status === "Despedido" || status === "Renunció"
					? calculateLiquidation(
							emp.baseWeeklySalary,
							emp.hireDate,
							status,
							basePay
						)
					: null;

			let loanDeduction = 0;
			let penalDeduction = 0;

			if (status === "Activo") {
				const loanIdx = updatedLoans.findIndex(
					(l) =>
						l.employeeId === emp.id &&
						l.status === "active" &&
						l.remainingWeeks > 0
				);
				if (loanIdx !== -1) {
					loanDeduction = updatedLoans[loanIdx].weeklyInstallment;
					updatedLoans[loanIdx].remainingWeeks -= 1;
					if (updatedLoans[loanIdx].remainingWeeks === 0)
						updatedLoans[loanIdx].status = "paid";
				}

				updatedPenalizations.forEach((p, idx) => {
					if (
						p.employeeId === emp.id &&
						p.status === "active" &&
						p.remainingWeeks > 0
					) {
						penalDeduction += p.weeklyInstallment;
						updatedPenalizations[idx].remainingWeeks -= 1;
						if (updatedPenalizations[idx].remainingWeeks === 0)
							updatedPenalizations[idx].status = "cleared";
					}
				});
			}

			const total = liq
				? liq.total
				: status === "Suspendido"
					? 0
					: basePay +
						extraHoursPay +
						emp.weeklyBonus -
						loanDeduction -
						penalDeduction;

			return {
				employeeId: emp.id,
				name: emp.fullName,
				department: emp.department?.name || "Logística",
				basePay,
				theoreticalBase,
				unpaidDaysAmount,
				holidayExtraPay,
				extraHoursCount: empExtraHours,
				extraHoursPay,
				bonus: status === "Suspendido" ? 0 : emp.weeklyBonus,
				daysWorked,
				holidaysWorked,
				loanDeduction: loanDeduction > 0 ? loanDeduction : undefined,
				penalizationDeduction: penalDeduction > 0 ? penalDeduction : undefined,
				liquidation: liq || undefined,
				total: Math.max(0, total),
			};
		});

		const newWeek: PayrollWeek = {
			id: generateId(),
			date: new Date().toISOString(),
			label: `Semana ${history.length + 1}`,
			summaries: finalSummaries,
			totalDisbursement: finalSummaries.reduce((acc, s) => acc + s.total, 0),
		};

		setLoans(updatedLoans);
		setPenalizations(updatedPenalizations);
		setHistory((prev) => [...prev, newWeek]);
		setExtraHours({});
		if (notificationSettings.payroll)
			setNotification("Ciclo cerrado exitosamente.");
		setActiveTab("PAGOS");
	};

	const handleExportPNG = async (week: PayrollWeek) => {
		const element = document.getElementById("week-report-content");
		if (!element) return;
		setIsExporting(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 300));
			const dataUrl = await toPng(element, {
				quality: 1,
				pixelRatio: 2,
				cacheBust: true,
				backgroundColor: theme === "dark" ? "#121213" : "#F5F5F7",
			});
			const link = document.createElement("a");
			link.download = `NOMINI-REPORT-${week.label}.png`;
			link.href = dataUrl;
			link.click();
			setNotification("Reporte generado.");
		} catch (err) {
			setNotification("Error de exportación.");
		} finally {
			setIsExporting(false);
		}
	};

	const handleSaveEmployee = async (e: Employee) => {
		try {
			if (isAddingEmployee) {
				const created = await employeesService.create(e);
				setEmployees((prev) => [...prev, created]);
				setNotification("Talento registrado exitosamente.");
			} else {
				const updated = await employeesService.update(e.id, e);
				setEmployees((prev) =>
					prev.map((x) => (x.id === updated.id ? updated : x))
				);
				setNotification("Perfil actualizado.");
			}
			setIsAddingEmployee(false);
			setEditingEmployee(null);
		} catch (err) {
			console.error("Error saving employee:", err);
			setNotification("Error al guardar cambios.");
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-charcoal-darker">
				<div className="w-10 h-10 border-4 border-electric/30 border-t-electric rounded-full animate-spin"></div>
			</div>
		);
	}

	if (!user) {
		if (authView === "register") {
			return <RegisterPage onBackToLogin={() => setAuthView("login")} />;
		}
		return <LoginPage onRegister={() => setAuthView("register")} />;
	}

	return (
		<div className="min-h-screen pb-40">
			{notification && (
				<div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-charcoal-darker border border-white/10 text-white px-8 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-slide-in text-center backdrop-blur-3xl">
					{notification}
				</div>
			)}

			{/* MODAL DE SUSPENSIÓN PERSONALIZADO */}
			{suspendingEmployeeId && (
				<div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/80 backdrop-blur-xl"
						onClick={() => setSuspendingEmployeeId(null)}
					></div>
					<div className="relative bg-charcoal border border-amber-500/30 w-full max-sm:max-w-none max-w-sm rounded-[2.5rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-slide-in">
						<div className="flex items-center gap-4 mb-8">
							<div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
								<span className="material-symbols-outlined text-3xl">
									pause_circle
								</span>
							</div>
							<div>
								<h3 className="text-white text-xl font-black uppercase tracking-tighter italic">
									Suspensión
								</h3>
								<p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
									Defina el periodo de sanción
								</p>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3 mb-8">
							{[1, 3, 5, 7, 15, 30].map((d) => (
								<button
									key={d}
									onClick={() => confirmSuspension(d)}
									className="h-14 bg-white/5 border border-white/5 rounded-2xl text-white font-black text-xs hover:bg-amber-500 hover:text-charcoal transition-all"
								>
									{d} DÍAS
								</button>
							))}
						</div>
						<div className="flex gap-3">
							<button
								onClick={() => setSuspendingEmployeeId(null)}
								className="flex-1 h-14 rounded-2xl text-slate-500 font-bold uppercase text-[10px] tracking-widest"
							>
								Cancelar
							</button>
							<button
								onClick={() =>
									confirmSuspension(
										parseInt(prompt("Ingrese días personalizados:", "3") || "3")
									)
								}
								className="flex-1 h-14 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest italic underline"
							>
								Otro Valor
							</button>
						</div>
					</div>
				</div>
			)}

			<header className="sticky top-0 z-[150] bg-charcoal-darker/80 backdrop-blur-2xl border-b border-white/5">
				<div className="max-w-5xl mx-auto flex items-center p-5 px-6 justify-between">
					<div className="flex items-center gap-5">
						<div className="bg-electric w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shadow-electric/30">
							<span className="material-symbols-outlined text-white text-3xl font-bold">
								diamond
							</span>
						</div>
						<div>
							<h1 className="text-titanium text-2xl font-black tracking-tight uppercase leading-none">
								NOMINI
							</h1>
							<p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">
								Payroll OS
							</p>
						</div>
					</div>
					<button
						onClick={() => setIsSettingsOpen(true)}
						className="w-12 h-12 rounded-2xl border border-white/10 p-1 group relative overflow-hidden active:scale-90"
					>
						<img
							src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
							className="w-full h-full rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all"
						/>
					</button>
				</div>
			</header>

			{isSettingsOpen && (
				<SettingsMenu
					departments={departments}
					setDepartments={setDepartments}
					notificationSettings={notificationSettings}
					setNotificationSettings={setNotificationSettings}
					onLogout={() => {
						logout();
						window.location.reload();
					}}
					onExport={() => {}}
					onClose={() => setIsSettingsOpen(false)}
					initialView={settingsInitialView}
					onTabSwitch={(tab) => {
						setActiveTab(tab as Tab);
						setIsSettingsOpen(false);
					}}
					theme={theme}
					onThemeChange={setTheme}
				/>
			)}

			<main className="max-w-5xl mx-auto p-6 sm:p-10">
				{activeTab === "TABLERO" && (
					<DashboardModule
						employees={employees}
						stats={stats as any}
						history={history}
						loans={loans}
						penalizations={penalizations}
						onTabChange={(t) => setActiveTab(t as Tab)}
						onOpenDepartments={() => setIsSettingsOpen(true)}
						onGrantPerformanceBonus={async (id, amt) => {
							const emp = employees.find((e) => e.id === id);
							if (!emp) return;
							try {
								const updated = await employeesService.update(id, {
									...emp,
									weeklyBonus: emp.weeklyBonus + amt,
								});
								setEmployees((prev) =>
									prev.map((e) => (e.id === id ? updated : e))
								);
								setNotification(`Bono de ${amt}$ otorgado a ${emp.fullName}`);
							} catch (err) {
								console.error("Error granting bonus:", err);
								setNotification("Error al otorgar bono.");
							}
						}}
						onEditEmployee={(emp) => setEditingEmployee(emp)}
					/>
				)}
				{activeTab === "PERSONAL" && (
					<div className="space-y-8 animate-slide-in">
						<div className="flex justify-between items-center">
							<h2 className="text-4xl font-black text-titanium italic uppercase tracking-tighter">
								Bóveda de Talento
							</h2>
							<button
								onClick={() => setIsAddingEmployee(true)}
								className="h-14 px-6 bg-electric text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3"
							>
								<span className="material-symbols-outlined">person_add</span>{" "}
								Nuevo
							</button>
						</div>
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
									Aún no has registrado ningún talento en el sistema. Comienza
									añadiendo a tu primer colaborador.
								</p>
								<button
									onClick={() => setIsAddingEmployee(true)}
									className="h-14 px-10 bg-electric text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-electric/20 hover:scale-105 transition-all"
								>
									Registrar Mi Primer Talento
								</button>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{employees.map((emp) => (
									<EmployeeCard
										key={emp.id}
										employee={emp}
										attendance={attendance[emp.id] || Array(7).fill("absent")}
										extraHours={extraHours[emp.id] || 0}
										status={emp.status || "Activo"}
										suspensionEndDate={suspensions[emp.id]}
										onAttendanceChange={(idx) =>
											handleAttendanceCycle(emp.id, idx)
										}
										onExtraHoursChange={(delta) =>
											handleUpdateExtraHours(emp.id, delta)
										}
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
						<button
							onClick={finalizeWeek}
							className="fixed bottom-24 right-10 bg-emerald text-white px-10 py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl z-[100]"
						>
							Cerrar Ciclo Semanal
						</button>
					</div>
				)}
				{activeTab === "PAGOS" && (
					<div className="space-y-8 animate-slide-in">
						<h2 className="text-4xl font-black text-titanium italic uppercase tracking-tighter">
							Archivo de Pagos
						</h2>
						{history
							.slice()
							.reverse()
							.map((week) => (
								<div
									key={week.id}
									onClick={() => setSelectedWeekForDetail(week)}
									className="bg-charcoal p-8 rounded-3xl border border-white/5 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-all"
								>
									<div>
										<p className="text-titanium text-lg font-black">
											{week.label}
										</p>
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
				{activeTab === "PRESTAMOS" && (
					<LoansModule
						employees={employees}
						loans={loans}
						onAddLoan={(l) => setLoans((p) => [...p, l])}
					/>
				)}
				{activeTab === "PENALIZACION" && (
					<PenalizationsModule
						employees={employees}
						penalizations={penalizations}
						onAddPenalization={(p) => setPenalizations((prev) => [...prev, p])}
					/>
				)}
				{activeTab === "LIQUIDACION" && (
					<LiquidationModule employees={employees} />
				)}
			</main>

			{selectedWeekForDetail && (
				<WeekDetailModal
					week={selectedWeekForDetail}
					employees={employees}
					isExporting={isExporting}
					onClose={() => setSelectedWeekForDetail(null)}
					onDownload={() => handleExportPNG(selectedWeekForDetail)}
				/>
			)}

			<div className="fixed bottom-0 left-0 right-0 z-[180] px-6 pb-8 pt-4 pointer-events-none">
				<div className="max-w-4xl mx-auto bg-charcoal-darker/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl p-2 flex justify-between pointer-events-auto overflow-x-auto no-scrollbar">
					{(
						[
							"TABLERO",
							"PERSONAL",
							"PAGOS",
							"PRESTAMOS",
							"PENALIZACION",
							"LIQUIDACION",
						] as Tab[]
					).map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`min-w-[70px] flex-1 py-4 px-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${activeTab === tab ? "bg-electric text-white scale-105" : "text-slate-600"}`}
						>
							<span className="material-symbols-outlined text-2xl">
								{tab === "TABLERO"
									? "grid_view"
									: tab === "PERSONAL"
										? "person_search"
										: tab === "PAGOS"
											? "wallet"
											: tab === "PRESTAMOS"
												? "account_balance"
												: tab === "PENALIZACION"
													? "gavel"
													: "request_quote"}
							</span>
							<span className="text-[8px] font-black uppercase tracking-widest">
								{tab}
							</span>
						</button>
					))}
				</div>
			</div>

			{(editingEmployee || isAddingEmployee) && (
				<EditEmployeeModal
					employee={
						editingEmployee || {
							id: "",
							fullName: "",
							position: "",
							departmentId: "",
							baseWeeklySalary: 0,
							weeklyBonus: 0,
							hireDate: new Date().toISOString().split("T")[0],
							avatarUrl: "",
							status: "Activo",
						}
					}
					departments={departments}
					loans={loans}
					penalizations={penalizations}
					isNew={isAddingEmployee}
					onSave={handleSaveEmployee}
					onClose={() => {
						setIsAddingEmployee(false);
						setEditingEmployee(null);
					}}
				/>
			)}
		</div>
	);
};

export default App;
