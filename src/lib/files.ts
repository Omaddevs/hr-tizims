export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function isImage(file: File) {
  return file.type.startsWith("image/");
}

export function isResume(file: File) {
  const ok = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];
  const ext = file.name.toLowerCase();
  return (
    ok.includes(file.type) ||
    ext.endsWith(".pdf") ||
    ext.endsWith(".doc") ||
    ext.endsWith(".docx") ||
    ext.endsWith(".jpg") ||
    ext.endsWith(".jpeg") ||
    ext.endsWith(".png")
  );
}
