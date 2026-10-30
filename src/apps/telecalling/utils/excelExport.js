/**
 * Builds an .xlsx in the browser (one sheet per entry) and downloads it.
 * xlsx-js-style is large, so it is only downloaded when the user exports.
 *
 * @param {{ name: string, headers: string[], rows: any[][] }[]} sheets
 *        rows are arrays in the same order as headers; a sheet with no rows still gets its header row
 * @param {string} fileName
 */
export async function exportSheetsToExcel(sheets, fileName) {
  const xlsxModule = await import("xlsx-js-style");
  const XLSX = xlsxModule.default ?? xlsxModule; // CommonJS package: API may sit on .default
  const workbook = XLSX.utils.book_new();

  const border = { style: "thin", color: { rgb: "CCCCCC" } };
  const headerStyle = {
    fill: { fgColor: { rgb: "90D916" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
    alignment: { horizontal: "center", vertical: "center" },
    border: { top: border, bottom: border, left: border, right: border },
  };

  sheets.forEach(({ name, headers, rows }) => {
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    headers.forEach((_, c) => {
      const ref = XLSX.utils.encode_cell({ r: 0, c });
      if (sheet[ref]) sheet[ref].s = headerStyle;
    });

    sheet["!cols"] = headers.map((header, c) => ({
      wch: Math.min(
        50,
        Math.max(
          String(header).length,
          ...rows.map((row) => String(row[c] ?? "").length),
        ) + 3,
      ),
    }));

    XLSX.utils.book_append_sheet(workbook, sheet, name);
  });

  XLSX.writeFile(workbook, fileName);
}
