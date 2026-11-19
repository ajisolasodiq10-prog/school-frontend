// Creates a CSV file in the browser and downloads it. No server needed.
function quote(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(quote).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
