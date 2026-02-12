export type EmployeeStatus = "Activo" | "Despedido" | "Renunció" | "Suspendido";
export type Department =
	| "Logística"
	| "Operaciones"
	| "Flota"
	| "Administración"
	| "Marketing"
	| "Depositario"
	| "Vendedor"
	| "Seguridad"
	| "Gerente"
	| "Contabilidad";
export type DayStatus = "worked" | "absent" | "holiday" | "excused";

export interface NotificationSettings {
	loans: boolean;
	payroll: boolean;
	attendance: boolean;
	security: boolean;
	soundType:
		| "classic"
		| "modern"
		| "glass"
		| "industrial"
		| "cashier"
		| "coins";
}

export interface Employee {
	id: string;
	fullName: string;
	email?: string;
	position: string;
	departmentId: string;
	department?: DeptObj;
	baseWeeklySalary: number;
	weeklyBonus: number;
	hireDate: string;
	avatarUrl: string;
	status: EmployeeStatus;
	paymentFrequency: "semanal" | "quincenal";
	suspensionUntil?: string;
}

export interface Loan {
	id: string;
	employeeId: string;
	amount: number;
	totalWeeks: number;
	remainingWeeks: number;
	weeklyInstallment: number;
	dateRequested: string;
	status: "active" | "paid" | "cancelled";
	notes?: string;
}

export interface Penalization {
	id: string;
	employeeId: string;
	category:
		| "Puntualidad"
		| "Abandono"
		| "Descuido Físico"
		| "Consumo"
		| "Disciplina";
	reason: string;
	amount: number;
	totalWeeks: number;
	remainingWeeks: number;
	weeklyInstallment: number;
	dateCreated: string;
	status: "active" | "cleared";
}

export interface AttendanceRecord {
	[employeeId: string]: DayStatus[];
}

export interface StatusRecord {
	[employeeId: string]: EmployeeStatus;
}

export interface SuspensionRecord {
	[employeeId: string]: string; // ISO Date of end
}

export interface LiquidationDetails {
	weeksOwed: number;
	severancePay: number;
	vacationPay: number;
	utilidadesPay: number;
	indemnityPay: number; // El "Doble" por despido (Art. 92 LOTTT)
	total: number;
}

export interface FinalSummary {
	employeeId: string;
	name: string;
	department: string;
	basePay: number;
	theoreticalBase: number;
	unpaidDaysAmount: number;
	holidayExtraPay: number;
	extraHoursCount: number;
	extraHoursPay: number;
	bonus: number;
	daysWorked: number;
	holidaysWorked: number;
	weekendWorkedCount?: number;
	loanDeduction?: number;
	penalizationDeduction?: number;
	liquidation?: LiquidationDetails;
	dailyAttendance?: DayStatus[];
	total: number;
}

export interface PayrollWeek {
	id: string;
	date: string;
	label: string;
	type: "semanal" | "quincenal";
	summaries: FinalSummary[];
	totalDisbursement: number;
}

export interface User {
	id: string;
	email: string;
	username: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface LoginDto {
	username: string;
	password: string;
}

export interface RegisterDto {
	email: string;
	username: string;
	password: string;
}

export interface AuthResponse {
	message: string;
	user: {
		id: string;
		email: string;
		username: string;
	};
	access_token: string;
}

export interface DeptObj {
	id: string;
	name: string;
}
