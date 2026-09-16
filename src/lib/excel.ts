function xmlEscape(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function utf8ToBase64(str: string) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function workbookXml(headers: string[], rows: Array<Array<string | number>>, sheetName = "Hisob") {
  const headerRow = headers
    .map((h) => `<Cell><Data ss:Type="String">${xmlEscape(h)}</Data></Cell>`)
    .join("");
  const body = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => {
            const n = typeof cell === "number";
            return `<Cell><Data ss:Type="${n ? "Number" : "String"}">${xmlEscape(cell)}</Data></Cell>`;
          })
          .join("")}</Row>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${xmlEscape(sheetName)}">
    <Table>
      <Row>${headerRow}</Row>
      ${body}
    </Table>
  </Worksheet>
</Workbook>`;
}

export function downloadExcel(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  sheetName = "Hisob",
) {
  const xml = workbookXml(headers, rows, sheetName);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function excelDataUrl(headers: string[], rows: Array<Array<string | number>>, sheetName = "Hisob") {
  const xml = workbookXml(headers, rows, sheetName);
  return `data:application/vnd.ms-excel;base64,${utf8ToBase64(xml)}`;
}
