import { Injectable } from '@angular/core';
import type { AssetEvent } from '../models';

export type AnalyticsExportParams = {
  assetId: string;
  rangeLabel: string;
  events: AssetEvent[];
};

type PdfMakeLike = {
  vfs?: Record<string, string>;
  addVirtualFileSystem?: (vfs: Record<string, string>) => void;
  createPdf: (docDefinition: unknown) => {
    download: (defaultFileName?: string) => void;
  };
};

@Injectable({ providedIn: 'root' })
export class AnalyticsExportService {
  private pdfMakePromise?: Promise<PdfMakeLike>;

  async exportPdf(params: AnalyticsExportParams): Promise<void> {
    const pdfMake = await this.getPdfMake();

    const rows = params.events.map((e) => [
      this.formatTs(e.ts),
      e.type ?? '',
      e.result ?? '',
      e.userLogin ?? '',
    ]);

    if (rows.length === 0) {
      rows.push(['Нет данных по выбранному периоду/фильтрам', '', '', '']);
    }

    const docDefinition = {
      pageOrientation: 'landscape',
      pageMargins: [20, 20, 20, 20],
      content: [
        {
          text: `Аналитика ассета: ${params.assetId || '—'}`,
          bold: true,
          margin: [0, 0, 0, 4],
        },
        {
          text: `Период: ${params.rangeLabel}`,
          fontSize: 9,
          color: '#666666',
          margin: [0, 0, 0, 4],
        },
        {
          text: `Записей: ${params.events.length}`,
          fontSize: 9,
          color: '#666666',
          margin: [0, 0, 0, 8],
        },
        {
          layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            widths: [110, 130, '*', 120],
            body: [
              ['Дата и время', 'Вид работ', 'Дополнительно', 'Пользователь'],
              ...rows,
            ],
          },
        },
      ],
      defaultStyle: {
        fontSize: 9,
      },
    };

    pdfMake.createPdf(docDefinition).download(this.buildFileName(params.assetId, 'pdf'));
  }

  exportCsvForExcel(params: AnalyticsExportParams): void {
    const headers = ['Дата и время', 'Вид работ', 'Дополнительно', 'Пользователь'];

    const dataRows =
      params.events.length > 0
        ? params.events.map((e) => [
            this.formatTs(e.ts),
            e.type ?? '',
            e.result ?? '',
            e.userLogin ?? '',
          ])
        : [['Нет данных по выбранному периоду/фильтрам', '', '', '']];

    const metaRows = [
      ['Ассет', params.assetId || '—'],
      ['Период', params.rangeLabel],
      ['Записей', String(params.events.length)],
      ['Экспортировано', this.formatDateTime(new Date())],
    ];

    const lines: string[] = ['sep=;'];

    for (const [k, v] of metaRows) {
      lines.push(`${this.csvCell(k)};${this.csvCell(v)}`);
    }

    lines.push('');
    lines.push(headers.map((h) => this.csvCell(h)).join(';'));

    for (const row of dataRows) {
      lines.push(row.map((x) => this.csvCell(x)).join(';'));
    }

    const csvText = lines.join('\r\n');
    const buffer = this.encodeWindows1251ToArrayBuffer(csvText);

    const blob = new Blob([buffer], { type: 'text/csv;charset=windows-1251;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildFileName(params.assetId, 'csv');
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  private async getPdfMake(): Promise<PdfMakeLike> {
    if (!this.pdfMakePromise) {
      this.pdfMakePromise = (async () => {
        const pdfMakeModule: any = await import('pdfmake/build/pdfmake');
        const pdfFontsModule: any = await import('pdfmake/build/vfs_fonts');

        const pdfMake: PdfMakeLike = (pdfMakeModule.default ?? pdfMakeModule) as PdfMakeLike;
        const fontsAny = pdfFontsModule.default ?? pdfFontsModule;
        const vfs = fontsAny?.pdfMake?.vfs ?? fontsAny?.vfs ?? fontsAny;

        if (typeof pdfMake.addVirtualFileSystem === 'function') {
          pdfMake.addVirtualFileSystem(vfs);
        } else {
          pdfMake.vfs = vfs;
        }

        return pdfMake;
      })();
    }

    return this.pdfMakePromise;
  }

  private csvCell(value: unknown): string {
    let s = String(value ?? '').replace(/\r?\n/g, ' ');

    if (/^[=+\-@]/.test(s)) {
      s = `'${s}`;
    }

    if (/[;"\n]/.test(s)) {
      s = `"${s.replace(/"/g, '""')}"`;
    }

    return s;
  }

  private encodeWindows1251ToArrayBuffer(text: string): ArrayBuffer {
    const bytes: number[] = [];

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const code = text.charCodeAt(i);

      if (code <= 0x7f) {
        bytes.push(code);
        continue;
      }

      if (code >= 0x0410 && code <= 0x044f) {
        bytes.push(code - 0x350);
        continue;
      }

      if (code === 0x0401) {
        bytes.push(0xa8); // Ё
        continue;
      }
      if (code === 0x0451) {
        bytes.push(0xb8); // ё
        continue;
      }
      if (code === 0x2116) {
        bytes.push(0xb9); // №
        continue;
      }

      switch (ch) {
        case '«':
          bytes.push(0xab);
          break;
        case '»':
          bytes.push(0xbb);
          break;
        case '–':
          bytes.push(0x96);
          break;
        case '—':
          bytes.push(0x97);
          break;
        case '…':
          bytes.push(0x85);
          break;
        case '•':
          bytes.push(0x95);
          break;
        case '°':
          bytes.push(0xb0);
          break;
        default:
          bytes.push(0x3f); // '?'
      }
    }

    const buffer = new ArrayBuffer(bytes.length);
    new Uint8Array(buffer).set(bytes);
    return buffer;
  }

  private formatTs(ts: string): string {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yy = String(d.getFullYear()).slice(-2);
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${dd}.${mm}.${yy} / ${hh}:${mi}`;
  }

  private formatDateTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
  }

  private buildFileName(assetId: string, ext: 'pdf' | 'csv'): string {
    const asset = (assetId || 'asset').replace(/[^\w.-]+/g, '_');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `_${pad(now.getHours())}${pad(now.getMinutes())}`;

    return `analytics_${asset}_${stamp}.${ext}`;
  }
}
