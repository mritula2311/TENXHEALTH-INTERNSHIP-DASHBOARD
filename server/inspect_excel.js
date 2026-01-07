const XLSX = require('xlsx');
try {
    const workbook = XLSX.readFile('c:\\dashboard for n8n\\Lenz Parameter History TenxHealth Technologies device 1.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Read rows 6, 7, 8 (index 5, 6, 7)
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 4, limit: 5 });
    console.log('Row 5:', JSON.stringify(data[0]));
    console.log('Row 6:', JSON.stringify(data[1]));
    console.log('Row 7:', JSON.stringify(data[2]));
    console.log('Row 8:', JSON.stringify(data[3]));
} catch (e) { console.error(e); }
