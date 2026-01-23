import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useMemo,
} from "react";
import {
	Employee,
	EmployeeStatus,
	AttendanceRecord,
	PayrollWeek,
	DayStatus,
	Loan,
	Penalization,
	SuspensionRecord,
	DeptObj,
	NotificationSettings,
} from "../types";
import departmentsService from "../services/departments.service";
import employeesService from "../services/employees.service";
import { payrollService } from "../services/payroll.service";
import {
	calculateLiquidation,
	generateId,
	isVenezuelanHoliday,
	getCurrentWeekDates,
} from "../utils";
import { useAuth } from "./AuthContext";

interface DataContextType {
	employees: Employee[];
	setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
	departments: DeptObj[];
	setDepartments: React.Dispatch<React.SetStateAction<DeptObj[]>>;
	loans: Loan[];
	setLoans: React.Dispatch<React.SetStateAction<Loan[]>>;
	penalizations: Penalization[];
	setPenalizations: React.Dispatch<React.SetStateAction<Penalization[]>>;
	history: PayrollWeek[];
	setHistory: React.Dispatch<React.SetStateAction<PayrollWeek[]>>;
	attendance: AttendanceRecord;
	setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord>>;
	extraHours: Record<string, number>;
	setExtraHours: React.Dispatch<React.SetStateAction<Record<string, number>>>;
	suspensions: SuspensionRecord;
	setSuspensions: React.Dispatch<React.SetStateAction<SuspensionRecord>>;
	notification: string | null;
	setNotification: (msg: string | null) => void;
	stats: {
		total: number;
		activeCount: number;
		attendanceRate: number;
		turnoverRate: number;
	};
	handleAttendanceCycle: (empId: string, dayIdx: number) => void;
	handleUpdateExtraHours: (empId: string, delta: number) => void;
	handleUpdateBonus: (empId: string, amount: number) => Promise<void>;
	handleStatusChange: (
		empId: string,
		newStatus: EmployeeStatus
	) => Promise<void>;
	confirmSuspension: (days: number) => Promise<void>;
	calculateCurrentPayroll: (isFinalizing?: boolean) => PayrollWeek;
	finalizeWeek: () => Promise<void>;
	handleSaveEmployee: (e: Employee, isNew: boolean) => Promise<void>;
	suspendingEmployeeId: string | null;
	setSuspendingEmployeeId: (id: string | null) => void;
	deptFilter: string;
	setDeptFilter: (filter: string) => void;
	currentCycleType: "semanal" | "quincenal";
	setCurrentCycleType: (type: "semanal" | "quincenal") => void;
	theme: "light" | "dark";
	setTheme: (theme: "light" | "dark") => void;
	notificationSettings: NotificationSettings;
	setNotificationSettings: React.Dispatch<
		React.SetStateAction<NotificationSettings>
	>;
	selectedWeekForDetail: PayrollWeek | null;
	setSelectedWeekForDetail: (week: PayrollWeek | null) => void;
	isPreviewingWeek: boolean;
	setIsPreviewingWeek: (val: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { user } = useAuth();
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [departments, setDepartments] = useState<DeptObj[]>([]);
	const [loans, setLoans] = useState<Loan[]>([]);
	const [penalizations, setPenalizations] = useState<Penalization[]>([]);
	const [history, setHistory] = useState<PayrollWeek[]>([]);
	const [attendance, setAttendance] = useState<AttendanceRecord>({});
	const [extraHours, setExtraHours] = useState<Record<string, number>>({});
	const [suspensions, setSuspensions] = useState<SuspensionRecord>({});
	const [notification, setNotification] = useState<string | null>(null);
	const [suspendingEmployeeId, setSuspendingEmployeeId] = useState<
		string | null
	>(null);
	const [deptFilter, setDeptFilter] = useState<string>("Todos");
	const [currentCycleType, setCurrentCycleType] = useState<
		"semanal" | "quincenal"
	>("semanal");
	const [theme, setTheme] = useState<"light" | "dark">("dark");
	const [notificationSettings, setNotificationSettings] =
		useState<NotificationSettings>({
			loans: true,
			payroll: true,
			attendance: true,
			security: true,
			soundType: "modern",
		});
	const [selectedWeekForDetail, setSelectedWeekForDetail] =
		useState<PayrollWeek | null>(null);
	const [isPreviewingWeek, setIsPreviewingWeek] = useState(false);

	useEffect(() => {
		if (user) {
			departmentsService.getAll().then(setDepartments).catch(console.error);
			employeesService
				.getAll()
				.then((emps) => {
					setEmployees(emps);
					const suspRecords: SuspensionRecord = {};
					emps.forEach((e: any) => {
						if (e.status === "Suspendido" && e.suspensionUntil) {
							suspRecords[e.id] = e.suspensionUntil;
						}
					});
					setSuspensions(suspRecords);
				})
				.catch(console.error);
			payrollService.getHistory().then(setHistory).catch(console.error);
			payrollService.getLoans().then(setLoans).catch(console.error);
			payrollService
				.getPenalizations()
				.then(setPenalizations)
				.catch(console.error);
		}
	}, [user]);

	useEffect(() => {
		if (notification) {
			const timer = setTimeout(() => setNotification(null), 4000);
			return () => clearTimeout(timer);
		}
	}, [notification]);

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
		const checkSuspensions = async () => {
			const now = new Date();
			const toReactivate: string[] = [];

			Object.entries(suspensions).forEach(([id, dateStr]) => {
				const endDate = new Date(dateStr as string);
				if (now >= endDate) {
					toReactivate.push(id);
				}
			});

			if (toReactivate.length > 0) {
				for (const id of toReactivate) {
					const emp = employees.find((e) => e.id === id);
					if (emp) {
						try {
							const updated = await employeesService.update(id, {
								...emp,
								status: "Activo",
								suspensionUntil: undefined,
							});
							setEmployees((prev) =>
								prev.map((e) => (e.id === id ? updated : e))
							);
							setSuspensions((prev) => {
								const next = { ...prev };
								delete next[id];
								return next;
							});
							setNotification(`${emp.fullName} ha cumplido su sanción.`);
						} catch (err) {
							console.error("Error auto-reactivating employee:", err);
						}
					}
				}
			}
		};

		const interval = setInterval(checkSuspensions, 10000); // Check every 10s
		return () => clearInterval(interval);
	}, [suspensions, employees]);

	useEffect(() => {
		if (employees.length > 0) {
			const weekDates = getCurrentWeekDates();
			const records: AttendanceRecord = {};
			employees.forEach((emp) => {
				const defaultWeek: DayStatus[] = weekDates.map((date, idx) => {
					if (idx === 5 || idx === 6) return "absent";
					if (isVenezuelanHoliday(date)) return "holiday";
					return "worked";
				});
				records[emp.id] = defaultWeek;
			});
			setAttendance(records);
		}
	}, [employees]);

	const stats = useMemo(() => {
		let total = 0;
		let activeCount = 0;
		let inactiveCount = 0;
		let totalDaysWorked = 0;
		let totalPotentialDays = 0;

		employees.forEach((emp) => {
			const status = emp.status || "Activo";
			const dailyRate = emp.baseWeeklySalary / 5;
			const extraHourRate = 2;
			const empAttendance = attendance[emp.id] || Array(7).fill("absent");
			const empExtraHours = extraHours[emp.id] || 0;

			const weekdays = empAttendance.slice(0, 5);
			const dreams = empAttendance.slice(5, 7);
			const weekdayWorkedCount = weekdays.filter((d) => d === "worked").length;
			const weekdayHolidayCount = weekdays.filter(
				(d) => d === "holiday"
			).length;
			const weekendWorkedCount = dreams.filter(
				(d) => d === "worked" || d === "holiday"
			).length;

			totalDaysWorked += weekdayWorkedCount + weekdayHolidayCount;
			const basePay =
				weekdayWorkedCount * dailyRate +
				weekdayHolidayCount * dailyRate * 2 +
				weekendWorkedCount * dailyRate * 2;
			const extraPay = empExtraHours * extraHourRate;
			totalPotentialDays += 5;

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

	const handleUpdateBonus = async (empId: string, amount: number) => {
		const emp = employees.find((e) => e.id === empId);
		if (!emp) return;
		try {
			const updated = await employeesService.update(empId, {
				...emp,
				weeklyBonus: amount,
			});
			setEmployees((prev) => prev.map((e) => (e.id === empId ? updated : e)));
			setNotification(`Bono de ${emp.fullName} actualizado.`);
		} catch (err) {
			console.error("Error updating bonus:", err);
			setNotification("Error al actualizar bono.");
		}
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
					suspensionUntil: null, // Clear the date in backend
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
				suspensionUntil: endDate.toISOString(),
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

	const calculateCurrentPayroll = (
		isFinalizing: boolean = false
	): PayrollWeek => {
		const updatedLoans = [...loans];
		const updatedPenalizations = [...penalizations];

		const finalSummaries: any[] = employees.map((emp) => {
			const status = emp.status || "Activo";
			const empAttendance = attendance[emp.id] || Array(7).fill("absent");
			const empExtraHours = extraHours[emp.id] || 0;

			const isQuincenal = currentCycleType === "quincenal";
			const frequencyMultiplier = isQuincenal ? 2.14 : 1;

			const theoreticalBase = emp.baseWeeklySalary * frequencyMultiplier;
			const dailyRate = emp.baseWeeklySalary / 5;
			const extraHourRate = 2;

			const weekdays = empAttendance.slice(0, 5);
			const dreams = empAttendance.slice(5, 7);

			const daysWorkedCount = weekdays.filter((d) => d === "worked").length;
			const holidayWorkedCount = weekdays.filter((d) => d === "holiday").length;
			const weekendWorkedCount = dreams.filter(
				(d) => d === "worked" || d === "holiday"
			).length;

			const daysAbsent = 5 - (daysWorkedCount + holidayWorkedCount);
			const unpaidDaysAmount = Math.max(0, daysAbsent * dailyRate);
			const holidayExtraPay =
				(holidayWorkedCount + weekendWorkedCount * 2) * dailyRate;
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
					if (isFinalizing) {
						updatedLoans[loanIdx].remainingWeeks -= 1;
						if (updatedLoans[loanIdx].remainingWeeks === 0)
							updatedLoans[loanIdx].status = "paid";
					}
				}

				updatedPenalizations.forEach((p, idx) => {
					if (
						p.employeeId === emp.id &&
						p.status === "active" &&
						p.remainingWeeks > 0
					) {
						penalDeduction += p.weeklyInstallment;
						if (isFinalizing) {
							updatedPenalizations[idx].remainingWeeks -= 1;
							if (updatedPenalizations[idx].remainingWeeks === 0)
								updatedPenalizations[idx].status = "cleared";
						}
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
				daysWorked: daysWorkedCount,
				holidaysWorked: holidayWorkedCount + weekendWorkedCount,
				weekendWorkedCount,
				loanDeduction: loanDeduction > 0 ? loanDeduction : undefined,
				penalizationDeduction: penalDeduction > 0 ? penalDeduction : undefined,
				liquidation: liq || undefined,
				dailyAttendance: empAttendance,
				total: Math.max(0, total),
			};
		});

		return {
			id: generateId(),
			date: new Date().toISOString(),
			label: `${currentCycleType === "semanal" ? "Semana" : "Quincena"} ${history.length + 1}`,
			type: currentCycleType,
			summaries: finalSummaries,
			totalDisbursement: finalSummaries.reduce((acc, s) => acc + s.total, 0),
			updatedLoans,
			updatedPenalizations,
		} as any;
	};

	const finalizeWeek = async () => {
		try {
			const result = calculateCurrentPayroll(true) as any;
			const saved = await payrollService.createCycle(result);
			setHistory((prev) => [saved, ...prev]);

			const updatedLoans = await payrollService.getLoans();
			const updatedPenalizations = await payrollService.getPenalizations();
			setLoans(updatedLoans);
			setPenalizations(updatedPenalizations);
			setExtraHours({});
			setAttendance({});
			setIsPreviewingWeek(false); // Close the modal
			setNotification("Ciclo cerrado exitosamente.");
		} catch (err) {
			console.error("Error finalizing week:", err);
			setNotification("Error al cerrar ciclo semanal.");
		}
	};

	const handleSaveEmployee = async (e: Employee, isNew: boolean) => {
		try {
			if (isNew) {
				const created = await employeesService.create(e);
				setEmployees((prev) => [...prev, created]);
				setNotification("Talento registrado exitosamente.");
			} else {
				const updated = await employeesService.update(e.id, e);
				setEmployees((prev) =>
					prev.map((x) => (x.id === updated.id ? updated : x))
				);

				// Sync local suspension state
				if (updated.status !== "Suspendido" && suspensions[updated.id]) {
					setSuspensions((prev) => {
						const next = { ...prev };
						delete next[updated.id];
						return next;
					});
				}

				setNotification("Perfil actualizado.");
			}
		} catch (err) {
			console.error("Error saving employee:", err);
			setNotification("Error al guardar cambios.");
		}
	};

	return (
		<DataContext.Provider
			value={{
				employees,
				setEmployees,
				departments,
				setDepartments,
				loans,
				setLoans,
				penalizations,
				setPenalizations,
				history,
				setHistory,
				attendance,
				setAttendance,
				extraHours,
				setExtraHours,
				suspensions,
				setSuspensions,
				notification,
				setNotification,
				stats,
				handleAttendanceCycle,
				handleUpdateExtraHours,
				handleUpdateBonus,
				handleStatusChange,
				confirmSuspension,
				calculateCurrentPayroll,
				finalizeWeek,
				handleSaveEmployee,
				suspendingEmployeeId,
				setSuspendingEmployeeId,
				deptFilter,
				setDeptFilter,
				currentCycleType,
				setCurrentCycleType,
				theme,
				setTheme,
				notificationSettings,
				setNotificationSettings,
				selectedWeekForDetail,
				setSelectedWeekForDetail,
				isPreviewingWeek,
				setIsPreviewingWeek,
			}}
		>
			{children}
		</DataContext.Provider>
	);
};

export const useData = () => {
	const context = useContext(DataContext);
	if (context === undefined)
		throw new Error("useData must be used within a DataProvider");
	return context;
};
