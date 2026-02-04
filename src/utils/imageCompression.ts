/**
 * Utilidad para comprimir imágenes antes de convertirlas a base64
 */

export interface ImageCompressionOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	outputFormat?: "image/jpeg" | "image/png" | "image/webp";
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
	maxWidth: 800,
	maxHeight: 800,
	quality: 0.8,
	outputFormat: "image/jpeg",
};

/**
 * Comprime una imagen y la convierte a base64
 * @param file - Archivo de imagen a comprimir
 * @param options - Opciones de compresión
 * @returns Promise con la imagen comprimida en base64
 */
export const compressImage = async (
	file: File,
	options: ImageCompressionOptions = {}
): Promise<string> => {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	return new Promise((resolve, reject) => {
		// Validar que sea un archivo de imagen
		if (!file.type.startsWith("image/")) {
			reject(new Error("El archivo debe ser una imagen"));
			return;
		}

		// Timeout de 30 segundos para evitar que se quede colgado
		const timeout = setTimeout(() => {
			reject(new Error("Tiempo de espera excedido al procesar la imagen"));
		}, 30000);

		const reader = new FileReader();

		reader.onerror = () => {
			clearTimeout(timeout);
			reject(new Error("Error al leer el archivo"));
		};

		reader.onload = (event) => {
			const img = new Image();

			img.onerror = () => {
				clearTimeout(timeout);
				reject(
					new Error(
						"Error al cargar la imagen. Asegúrese de que el archivo sea una imagen válida."
					)
				);
			};

			img.onload = () => {
				try {
					// Calcular nuevas dimensiones manteniendo la proporción
					let { width, height } = img;

					if (width > opts.maxWidth) {
						height = (height * opts.maxWidth) / width;
						width = opts.maxWidth;
					}

					if (height > opts.maxHeight) {
						width = (width * opts.maxHeight) / height;
						height = opts.maxHeight;
					}

					// Crear canvas y dibujar imagen redimensionada
					const canvas = document.createElement("canvas");
					canvas.width = width;
					canvas.height = height;

					const ctx = canvas.getContext("2d");
					if (!ctx) {
						clearTimeout(timeout);
						reject(new Error("No se pudo obtener el contexto del canvas"));
						return;
					}

					// Configurar calidad de renderizado
					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = "high";

					// Dibujar imagen
					ctx.drawImage(img, 0, 0, width, height);

					// Convertir a base64 con compresión
					const compressedBase64 = canvas.toDataURL(
						opts.outputFormat,
						opts.quality
					);

					clearTimeout(timeout);
					resolve(compressedBase64);
				} catch (error) {
					clearTimeout(timeout);
					reject(new Error(`Error al comprimir la imagen: ${error}`));
				}
			};

			img.src = event.target?.result as string;
		};

		reader.readAsDataURL(file);
	});
};

/**
 * Valida el tamaño de un archivo
 * @param file - Archivo a validar
 * @param maxSizeMB - Tamaño máximo en MB
 * @returns true si el archivo es válido, false en caso contrario
 */
export const validateFileSize = (
	file: File,
	maxSizeMB: number = 50
): boolean => {
	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	return file.size <= maxSizeBytes;
};

/**
 * Valida el tipo de archivo de imagen
 * @param file - Archivo a validar
 * @param allowedTypes - Tipos MIME permitidos
 * @returns true si el tipo es válido, false en caso contrario
 */
export const validateImageType = (
	file: File,
	allowedTypes: string[] = [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
	]
): boolean => {
	return allowedTypes.includes(file.type);
};

/**
 * Formatea el tamaño de archivo en formato legible
 * @param bytes - Tamaño en bytes
 * @returns Tamaño formateado (ej: "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
