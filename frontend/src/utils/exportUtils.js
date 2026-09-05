/**
 * Enterprise Report & Document Export Utilities for FiberPulse
 */

// 1. Export Data to CSV / Excel with UTF-8 BOM
export const exportToExcel = (arg1, arg2, arg3) => {
  try {
    let filename = 'Laporan_SGT_NET';
    let headers = [];
    let rows = [];

    // Case 1: exportToExcel(exportRows, columns, filename)
    if (Array.isArray(arg1) && Array.isArray(arg2)) {
      rows = arg1;
      const columns = arg2;
      filename = typeof arg3 === 'string' ? arg3 : filename;

      // Extract header labels
      headers = columns.map(col => typeof col === 'object' ? (col.label || col.key || '') : String(col));

      // Map rows from objects
      const formattedRows = rows.map(row => {
        if (Array.isArray(row)) return row;
        return columns.map(col => {
          const key = typeof col === 'object' ? (col.key || col.label) : col;
          return row[key] ?? '';
        });
      });
      rows = formattedRows;
    } 
    // Case 2: exportToExcel(filename, headers, rows)
    else if (typeof arg1 === 'string' && Array.isArray(arg2) && Array.isArray(arg3)) {
      filename = arg1;
      headers = arg2.map(h => typeof h === 'object' ? (h.label || h.key || '') : String(h));
      rows = arg3.map(row => {
        if (Array.isArray(row)) return row;
        if (typeof row === 'object' && row !== null) return Object.values(row);
        return [row];
      });
    }

    const csvRows = [];
    
    // Header row
    csvRows.push(headers.map(h => `"${String(h ?? '').replace(/"/g, '""')}"`).join(','));

    // Data rows
    rows.forEach(row => {
      const values = (Array.isArray(row) ? row : [row]).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n'); // UTF-8 BOM for Microsoft Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Export to CSV/Excel failed:', err);
    return false;
  }
};

// 2. Open High-Fidelity Printable PDF Window with Formal Company Header & Signature
export const printReportDocument = ({
  title = 'LAPORAN REKAPITULASI ASET GUDANG',
  subtitle = 'Sistem Manajemen Logistik Terintegrasi',
  docNumber = `BAST-SGT-${Date.now().toString().slice(-6)}`,
  date = null,
  headers = [],
  rows = [],
  columns = null,
  data = null,
  summaryCards = null,
  notes = '',
  signee1 = null,
  signee2 = null,
  signature1Title = null,
  signature2Title = null
}) => {
  // Support both columns/data and headers/rows seamlessly
  let finalHeaders = Array.isArray(headers) && headers.length > 0 ? headers : [];
  let finalRows = Array.isArray(rows) && rows.length > 0 ? rows : [];

  if (columns && Array.isArray(columns)) {
    finalHeaders = columns.map(c => typeof c === 'object' ? (c.label || c.key || '') : String(c));
    if (data && Array.isArray(data)) {
      finalRows = data.map(item => {
        if (Array.isArray(item)) return item;
        return columns.map(c => {
          const key = typeof c === 'object' ? (c.key || c.label) : c;
          return item[key] ?? '';
        });
      });
    }
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up diblokir oleh browser. Harap izinkan pop-up untuk mencetak dokumen.');
    return;
  }

  const currentDate = date || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const signTitle1 = signature1Title || signee1 || 'Admin Logistik';
  const signTitle2 = signature2Title || signee2 || 'Pimpinan / Direktur Operasional';

  const tableHeaderHtml = finalHeaders.map(h => `
    <th style="border: 1px solid #CBD5E1; padding: 8px 12px; background-color: #F1F5F9; font-size: 11px; text-transform: uppercase; color: #1E293B; text-align: left; font-weight: 700;">
      ${h}
    </th>
  `).join('');

  const tableRowsHtml = finalRows.map((row, idx) => `
    <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
      ${(Array.isArray(row) ? row : [row]).map(val => `
        <td style="border: 1px solid #E2E8F0; padding: 7px 12px; font-size: 11px; color: #334155; vertical-align: middle;">
          ${val}
        </td>
      `).join('')}
    </tr>
  `).join('');

  const summaryCardsHtml = summaryCards && Array.isArray(summaryCards) && summaryCards.length > 0 ? `
    <div style="display: grid; grid-template-columns: repeat(${summaryCards.length}, 1fr); gap: 10px; margin: 12px 0 16px 0;">
      ${summaryCards.map(c => `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 6px; text-align: center;">
          <div style="font-size: 9px; color: #64748B; font-weight: 750; text-transform: uppercase; letter-spacing: 0.04em;">${c.label}</div>
          <div style="font-size: 13px; font-weight: 900; color: #1E3A8A; margin-top: 3px; font-family: monospace;">${c.value}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title} — FiberPulse Technologies Inc.</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 12mm 15mm 12mm;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0F172A;
          margin: 0;
          padding: 20px;
          background: #FFFFFF;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2.5px solid #1E3A8A;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .company-title {
          font-size: 16px;
          font-weight: 900;
          color: #1E3A8A;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .company-sub {
          font-size: 10px;
          color: #64748B;
          margin: 2px 0 0 0;
          font-weight: 500;
        }
        .doc-meta {
          text-align: right;
          font-size: 10px;
          color: #475569;
        }
        .doc-title-box {
          text-align: center;
          margin: 14px 0 10px 0;
        }
        .doc-title {
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          color: #0F172A;
          margin: 0;
          letter-spacing: 0.02em;
        }
        .doc-sub {
          font-size: 10.5px;
          color: #64748B;
          margin-top: 3px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 14px 0;
        }
        .signature-grid {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          page-break-inside: avoid;
        }
        .sign-box {
          width: 220px;
          text-align: center;
        }
        .sign-line {
          margin-top: 55px;
          border-bottom: 1px solid #334155;
          font-weight: 700;
          font-size: 11px;
          padding-bottom: 2px;
        }
        .sign-role {
          font-size: 10px;
          color: #64748B;
          margin-top: 3px;
        }
        .print-btn-bar {
          position: fixed;
          top: 10px;
          right: 10px;
          background: #1E3A8A;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        @media print {
          .print-btn-bar { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn-bar" onclick="window.print()">🖨️ Cetak Dokumen / Simpan PDF</button>

      <div class="header-container">
        <div>
          <h1 class="company-title">FIBERPULSE TECHNOLOGIES INC.</h1>
          <p class="company-sub">FiberPulse ISP — ISP & FTTH Network Infrastructure Management System</p>
          <p class="company-sub">Kantor Operasional: Subang, Jawa Barat | fiberpulse.io</p>
        </div>
        <div class="doc-meta">
          <div><strong>No. Dokumen:</strong> ${docNumber}</div>
          <div><strong>Tanggal:</strong> ${currentDate}</div>
          <div><strong>Sistem:</strong> Validasi Terverifikasi Otomatis</div>
        </div>
      </div>

      <div class="doc-title-box">
        <h2 class="doc-title">${title}</h2>
        <div class="doc-sub">${subtitle}</div>
      </div>

      ${summaryCardsHtml}

      <table>
        <thead>
          <tr>
            ${tableHeaderHtml}
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      ${notes ? `
        <div style="font-size: 10px; color: #64748B; margin-top: 10px; border-left: 3px solid #CBD5E1; padding-left: 8px;">
          <strong>Catatan:</strong> ${notes}
        </div>
      ` : ''}

      <div class="signature-grid">
        <div class="sign-box">
          <div style="font-size: 10px; color: #64748B;">Dibuat Oleh,</div>
          <div class="sign-line">${signTitle1}</div>
          <div class="sign-role">Divisi Logistik & Infrastruktur</div>
        </div>
        <div class="sign-box">
          <div style="font-size: 10px; color: #64748B;">Subang, ${currentDate}<br>Disetujui & Diverifikasi Oleh,</div>
          <div class="sign-line">${signTitle2}</div>
          <div class="sign-role">Direktur Operasional FiberPulse</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
