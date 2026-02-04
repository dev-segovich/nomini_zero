import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { SettingsMenu } from "../components/SettingsMenu";
import { EditEmployeeModal } from "../components/EditEmployeeModal";
import { WeekDetailModal } from "../components/WeekDetailModal";
import { toPng } from "html-to-image";
import { PayrollWeek } from "../types";

export const MainLayout: React.FC = () => {
	const {
		notification,
		suspendingEmployeeId,
		setSuspendingEmployeeId,
		confirmSuspension,
		isSettingsOpen,
		setIsSettingsOpen,
		departments,
		setDepartments,
		notificationSettings,
		setNotificationSettings,
		logout,
		theme,
		setTheme,
		employees,
		loans,
		penalizations,
		handleSaveEmployee,
		selectedWeekForDetail,
		setSelectedWeekForDetail,
		isPreviewingWeek,
		setIsPreviewingWeek,
		calculateCurrentPayroll,
		handleAttendanceCycle,
		handleUpdateExtraHours,
		handleUpdateBonus,
		finalizeWeek,
		setNotification,
	} = useData() as any;

	const { logout: authLogout } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const [isLocalSettingsOpen, setIsLocalSettingsOpen] = useState(false);
	const [isAddingEmployee, setIsAddingEmployee] = useState(false);
	const [editingEmployee, setEditingEmployee] = useState<any>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [showNav, setShowNav] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);

	// Hide/Show navigation based on scroll direction
	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;

			// Show nav when scrolling up, hide when scrolling down
			if (currentScrollY < lastScrollY || currentScrollY < 50) {
				setShowNav(true);
			} else if (currentScrollY > lastScrollY && currentScrollY > 100) {
				setShowNav(false);
			}

			setLastScrollY(currentScrollY);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [lastScrollY]);

	const tabs = [
		{ id: "TABLERO", label: "TABLERO", path: "/", icon: "grid_view" },
		{
			id: "PERSONAL",
			label: "PERSONAL",
			path: "/personal",
			icon: "person_search",
		},
		{ id: "PAGOS", label: "PAGOS", path: "/pagos", icon: "wallet" },
		{
			id: "PRESTAMOS",
			label: "PRESTAMOS",
			path: "/prestamos",
			icon: "account_balance",
		},
		{
			id: "PENALIZACION",
			label: "PENALIZACION",
			path: "/penalizaciones",
			icon: "gavel",
		},
		{
			id: "LIQUIDACION",
			label: "LIQUIDACION",
			path: "/liquidacion",
			icon: "request_quote",
		},
	];

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

	return (
		<div className="min-h-screen pb-40">
			{notification && (
				<div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] bg-charcoal-darker border border-white/10 text-white px-8 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-slide-in text-center backdrop-blur-3xl">
					{notification}
				</div>
			)}

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
										parseInt(
											prompt("Ingrese d\u00EDas personalizados:", "3") || "3"
										)
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
					<div
						className="flex items-center gap-5 cursor-pointer"
						onClick={() => navigate("/")}
					>
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
						onClick={() => setIsLocalSettingsOpen(true)}
						className="w-12 h-12 rounded-2xl border border-white/10 p-1 group relative overflow-hidden active:scale-90"
					>
						<img
							src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
							className="w-full h-full rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all"
						/>
					</button>
				</div>
			</header>

			{isLocalSettingsOpen && (
				<SettingsMenu
					departments={departments}
					setDepartments={setDepartments}
					notificationSettings={notificationSettings}
					setNotificationSettings={setNotificationSettings}
					onLogout={() => {
						authLogout();
						navigate("/login");
					}}
					onExport={() => {}}
					onClose={() => setIsLocalSettingsOpen(false)}
					initialView="main"
					onTabSwitch={(tab) => {
						const target = tabs.find((t) => t.id === tab);
						if (target) navigate(target.path);
						setIsLocalSettingsOpen(false);
					}}
					theme={theme}
					onThemeChange={setTheme}
				/>
			)}

			<main className="max-w-5xl mx-auto p-6 sm:p-10">
				<Outlet
					context={{
						setIsAddingEmployee,
						setEditingEmployee,
						setIsPreviewingWeek,
						setSelectedWeekForDetail,
					}}
				/>
			</main>

			{(selectedWeekForDetail || isPreviewingWeek) && (
				<WeekDetailModal
					week={selectedWeekForDetail || calculateCurrentPayroll()}
					employees={employees}
					isExporting={isExporting}
					onClose={() => {
						setSelectedWeekForDetail(null);
						setIsPreviewingWeek(false);
					}}
					onDownload={() =>
						handleExportPNG(selectedWeekForDetail || calculateCurrentPayroll())
					}
					onAttendanceChange={
						isPreviewingWeek ? handleAttendanceCycle : undefined
					}
					onExtraHoursChange={
						isPreviewingWeek ? handleUpdateExtraHours : undefined
					}
					onBonusChange={isPreviewingWeek ? handleUpdateBonus : undefined}
					onEditEmployee={(emp) => setEditingEmployee(emp)}
					onFinalize={
						isPreviewingWeek
							? async () => {
									await finalizeWeek();
									navigate("/pagos");
								}
							: undefined
					}
				/>
			)}

			<div
				className={`fixed bottom-0 left-0 right-0 z-[180] px-6 pb-8 pt-4 pointer-events-none transition-transform duration-300 ${showNav ? "translate-y-0" : "translate-y-full"}`}
			>
				<div className="max-w-4xl mx-auto bg-charcoal-darker/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl p-2 flex justify-between pointer-events-auto overflow-x-auto no-scrollbar">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => navigate(tab.path)}
							className={`min-w-[70px] flex-1 py-4 px-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${location.pathname === tab.path ? "bg-electric text-white scale-105" : "text-slate-600"}`}
						>
							<span className="material-symbols-outlined text-2xl">
								{tab.icon}
							</span>
							<span className="text-[8px] font-black uppercase tracking-widest">
								{tab.label}
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
					onSave={async (e) => {
						await handleSaveEmployee(e, isAddingEmployee);
						setIsAddingEmployee(false);
						setEditingEmployee(null);
					}}
					onClose={() => {
						setIsAddingEmployee(false);
						setEditingEmployee(null);
					}}
				/>
			)}
		</div>
	);
};
