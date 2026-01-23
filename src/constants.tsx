import { Employee, PayrollWeek, FinalSummary } from "./types";
import { generateId } from "./utils";
import defaultAvatar from "./assets/default.png";

// Mapped to match backend Employee structure
export const INITIAL_EMPLOYEES: Employee[] = [
	{
		id: "1",
		fullName: "Marcus V. Chen",
		position: "Líder de Logística",
		departmentId: "dept-1",
		department: { id: "dept-1", name: "Logística" },
		baseWeeklySalary: 50,
		weeklyBonus: 0,
		hireDate: "2021-03-15",
		avatarUrl:
			"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
		status: "Activo",
		paymentFrequency: "semanal",
	},
	{
		id: "2",
		fullName: "Elena Rodríguez",
		position: "Gerente de Operaciones",
		departmentId: "dept-2",
		department: { id: "dept-2", name: "Operaciones" },
		baseWeeklySalary: 50,
		weeklyBonus: 0,
		hireDate: "2019-11-22",
		avatarUrl:
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
		status: "Activo",
		paymentFrequency: "semanal",
	},
];

export const DEFAULT_AVATAR = defaultAvatar;

export const DAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];

// Nuevas categorías integradas
export const DEPARTMENTS = [
	{ id: "dept-1", name: "Logística" },
	{ id: "dept-2", name: "Operaciones" },
	{ id: "dept-3", name: "Flota" },
	{ id: "dept-4", name: "Administración" },
	{ id: "dept-5", name: "Marketing" },
	{ id: "dept-6", name: "Vendedor" },
];

// Generación de 8 semanas de historial (2 meses)
const generateMockHistory = (): PayrollWeek[] => {
	const history: PayrollWeek[] = [];
	const baseDate = new Date();

	for (let i = 8; i > 0; i--) {
		const weekDate = new Date(baseDate);
		weekDate.setDate(baseDate.getDate() - i * 7);

		const summaries: FinalSummary[] = INITIAL_EMPLOYEES.map((emp) => {
			const theoreticalBase = emp.baseWeeklySalary;
			const dailyRate = theoreticalBase / 6;
			let daysWorked = 6;
			let holidaysWorked = 0;
			let unpaidDaysAmount = 0;
			let holidayExtraPay = 0;

			const rand = Math.random();
			if (rand > 0.8) {
				daysWorked = 5;
				unpaidDaysAmount = dailyRate;
			}
			if (rand < 0.1) {
				holidaysWorked = 1;
				holidayExtraPay = dailyRate;
			}

			const basePay = theoreticalBase - unpaidDaysAmount + holidayExtraPay;
			const extraHoursCount = 0;
			const extraHoursPay = 0;

			return {
				employeeId: emp.id,
				name: emp.fullName,
				department: emp.department?.name || "Logística",
				basePay: basePay,
				theoreticalBase: theoreticalBase,
				unpaidDaysAmount: unpaidDaysAmount,
				holidayExtraPay: holidayExtraPay,
				extraHoursCount: extraHoursCount,
				extraHoursPay: extraHoursPay,
				bonus: emp.weeklyBonus,
				daysWorked: daysWorked,
				holidaysWorked: holidaysWorked,
				dailyAttendance: Array(7).fill("worked"),
				total: basePay + extraHoursPay + emp.weeklyBonus,
			};
		});

		history.push({
			id: generateId(),
			date: weekDate.toISOString(),
			label: `Semana ${9 - i}`,
			type: "semanal",
			summaries: summaries,
			totalDisbursement: summaries.reduce((acc, s) => acc + s.total, 0),
		});
	}
	return history;
};

export const MOCK_HISTORY = generateMockHistory();
