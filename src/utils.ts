import { EmployeeStatus, LiquidationDetails } from "./types";

export const calculateSeniority = (hireDate: string) => {
	const start = new Date(hireDate);
	const end = new Date();

	let years = end.getFullYear() - start.getFullYear();
	let months = end.getMonth() - start.getMonth();
	let days = end.getDate() - start.getDate();

	if (days < 0) {
		months -= 1;
		days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
	}
	if (months < 0) {
		years -= 1;
		months += 12;
	}

	return { years, months, days };
};

export const calculateLiquidation = (
	baseWeeklySalary: number,
	hireDate: string,
	status: EmployeeStatus,
	unpaidWeekPay: number,
	customUtilityDaysPerYear?: number,
	customVacationBaseDays?: number
): LiquidationDetails | null => {
	// Las suspensiones y activos no generan liquidación
	if (status === "Activo" || status === "Suspendido") return null;

	const { years, months, days } = calculateSeniority(hireDate);

	// Total de meses trabajados
	const totalMonths = years * 12 + months;

	// Total de días trabajados (aproximado)
	const totalDays = years * 365 + months * 30 + days;

	// ============================================
	// PASO 1: CALCULAR SALARIO INTEGRAL
	// ============================================
	// Salario Integral = Salario Base + Alícuota Utilidades + Alícuota Bono Vacacional

	// Validar y aplicar valores personalizados (con límites LOTTT)
	// Utilidades: Mínimo 15 días, Máximo 120 días (4 meses)
	const utilityDaysPerYear =
		customUtilityDaysPerYear && !isNaN(customUtilityDaysPerYear)
			? Math.max(15, Math.min(120, customUtilityDaysPerYear))
			: 30;

	// Vacaciones base: Mínimo 15 días, Máximo 30 días
	const vacationBaseOverride =
		customVacationBaseDays && !isNaN(customVacationBaseDays)
			? Math.max(15, Math.min(30, customVacationBaseDays))
			: null;

	// Salario diario base
	const dailyBaseSalary = baseWeeklySalary / 7;

	// Alícuota de Utilidades (días al año / 365 días)
	const utilidadesAliquot =
		(baseWeeklySalary * 4.33 * utilityDaysPerYear) / 365;

	// Alícuota de Bono Vacacional (mínimo 7 días al año / 365 días)
	const bonusVacationalAliquot = (baseWeeklySalary * 4.33 * 7) / 365;

	// Salario Integral Diario
	const dailyIntegralSalary =
		dailyBaseSalary + utilidadesAliquot / 30 + bonusVacationalAliquot / 30;

	// ============================================
	// 2. PRESTACIONES SOCIALES (Art. 141-143 LOTTT)
	// ============================================
	// Calculadas sobre SALARIO INTEGRAL
	// Antigüedad:
	// - 5 días por mes durante el primer año (60 días)
	// - 2 días por mes a partir del segundo año

	let severanceDays = 0;

	if (totalMonths <= 12) {
		// Primer año: 5 días por mes
		severanceDays = totalMonths * 5;
	} else {
		// Primer año completo: 60 días
		severanceDays = 60;
		// Años subsiguientes: 2 días por mes
		const remainingMonths = totalMonths - 12;
		severanceDays += remainingMonths * 2;
	}

	// Mínimo garantizado: 30 días por año (Art. 142)
	const minimumSeveranceDays = years * 30;
	severanceDays = Math.max(severanceDays, minimumSeveranceDays);

	// Aplicar SALARIO INTEGRAL
	const severancePay = severanceDays * dailyIntegralSalary;

	// ============================================
	// 3. VACACIONES VENCIDAS NO DISFRUTADAS (Art. 190-195 LOTTT)
	// ============================================
	// Base: 15 días hábiles en el primer año
	// Adicional: 1 día por año hasta 15 días adicionales (máximo 30 días)
	// Bono vacacional: Mínimo 7 días, hasta 21 días

	// Vacaciones acumuladas completas (años completos trabajados)
	let totalVacationDays = 0;
	let totalBonusDays = 0;

	// Por cada año completo
	for (let i = 0; i < years; i++) {
		// Si se especificó override, usar ese valor; sino calcular progresivo
		const vacDaysForYear =
			vacationBaseOverride !== null
				? vacationBaseOverride
				: 15 + Math.min(i, 15);
		const bonusDaysForYear = 7 + Math.min(i, 14); // 7 base + 1 por año
		totalVacationDays += vacDaysForYear;
		totalBonusDays += bonusDaysForYear;
	}

	// Fracción del año en curso
	const currentYearVacationBaseDays =
		vacationBaseOverride !== null
			? vacationBaseOverride
			: 15 + Math.min(years, 15);
	const currentYearBonusDays = 7 + Math.min(years, 14);

	const vacationProportionDays = (currentYearVacationBaseDays * months) / 12;
	const bonusProportionDays = (currentYearBonusDays * months) / 12;

	totalVacationDays += vacationProportionDays;
	totalBonusDays += bonusProportionDays;

	// Pago total de vacaciones (días de vacaciones + bono vacacional) sobre SALARIO INTEGRAL
	const vacationPay =
		(totalVacationDays + totalBonusDays) * dailyIntegralSalary;

	// ============================================
	// 4. UTILIDADES NO PAGADAS (Art. 131-140 LOTTT)
	// ============================================
	// Mínimo 15 días de salario por año
	// Las utilidades se calculan sobre el SALARIO INTEGRAL

	// Utilidades acumuladas completas (años completos) - usar el valor ajustado
	let totalUtilityDays = years * utilityDaysPerYear;

	// Fracción del año en curso
	const currentYearUtilityDays = (utilityDaysPerYear * months) / 12;
	totalUtilityDays += currentYearUtilityDays;

	// Aplicar SALARIO INTEGRAL
	const utilidadesPay = totalUtilityDays * dailyIntegralSalary;

	// ============================================
	// 5. INDEMNIZACIÓN POR DESPIDO INJUSTIFICADO (Art. 92 LOTTT)
	// ============================================
	// Solo aplica si el status es "Despedido"
	// Calculada sobre SALARIO INTEGRAL
	// Fórmula:
	// - Menos de 3 meses: 15 días de salario
	// - 3 meses a menos de 6 meses: 30 días
	// - 6 meses a menos de 1 año: 45 días
	// - 1 año o más: 60 días + 30 días por cada año adicional (sin límite)

	let indemnityPay = 0;

	if (status === "Despedido") {
		let indemnityDays = 0;

		if (totalMonths < 3) {
			indemnityDays = 15;
		} else if (totalMonths < 6) {
			indemnityDays = 30;
		} else if (totalMonths < 12) {
			indemnityDays = 45;
		} else {
			// 1 año o más: 60 días + 30 por cada año adicional
			indemnityDays = 60;
			if (years > 1) {
				indemnityDays += (years - 1) * 30;
			}
		}

		// Aplicar SALARIO INTEGRAL
		indemnityPay = indemnityDays * dailyIntegralSalary;
	}

	// ============================================
	// TOTAL DE LIQUIDACIÓN
	// ============================================
	// Todos los conceptos calculados sobre SALARIO INTEGRAL
	return {
		weeksOwed: unpaidWeekPay,
		severancePay,
		vacationPay,
		utilidadesPay,
		indemnityPay,
		total:
			unpaidWeekPay + severancePay + vacationPay + utilidadesPay + indemnityPay,
	};
};

export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const isVenezuelanHoliday = (date: Date): boolean => {
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const fixedHolidays = [
		{ m: 1, d: 1 },
		{ m: 4, d: 19 },
		{ m: 5, d: 1 },
		{ m: 6, d: 24 },
		{ m: 7, d: 5 },
		{ m: 7, d: 24 },
		{ m: 10, d: 12 },
		{ m: 12, d: 24 },
		{ m: 12, d: 25 },
		{ m: 12, d: 31 },
	];
	return fixedHolidays.some((h) => h.m === month && h.d === day);
};

export const getCurrentWeekDates = (count: number = 7): Date[] => {
	const now = new Date();
	const dayOfWeek = now.getDay();
	const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
	const monday = new Date(now.setDate(diffToMonday));
	const dates: Date[] = [];
	for (let i = 0; i < count; i++) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		dates.push(d);
	}
	return dates;
};
