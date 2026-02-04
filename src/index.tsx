import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";

import { Toaster } from "sonner";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
	<React.StrictMode>
		<AuthProvider>
			<DataProvider>
				<BrowserRouter>
					<App />
					<Toaster richColors position="top-center" theme="dark" />
				</BrowserRouter>
			</DataProvider>
		</AuthProvider>
	</React.StrictMode>
);
