import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { PengurusRtMap, PengurusRw, RtKey, Surat, Warga } from '@/types/rw10';

export async function generateAndDownloadSuratDocx(
  surat: Surat,
  pengurusRw: PengurusRw,
  pengurusRt: PengurusRtMap,
  matchedWarga?: Warga
): Promise<void> {
  const namaKetuaRW = pengurusRw.ketua?.nama || 'H. Bambang Sutrisno';
  const infoRT = pengurusRt[surat.rt as RtKey] || { ketua: `Ketua ${surat.rt || 'RT'}` };
  const namaKetuaRT = infoRT.ketua || `Ketua ${surat.rt || 'RT'}`;
  const blokInfo = matchedWarga?.blok ? `${matchedWarga.blok}, ` : '';

  const tglSurat = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const noSurat = `${surat.kode.replace('RW10-', '')}/RW10-PH/XI/${new Date().getFullYear()}`;
  const noBorder = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
  };

  const buatBarisData = (label: string, nilai: string) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: noBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: label, font: 'Times New Roman', size: 24 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 5, type: WidthType.PERCENTAGE },
          borders: noBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: ':', font: 'Times New Roman', size: 24 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: noBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: nilai || '-',
                  font: 'Times New Roman',
                  size: 24,
                  bold: label === 'Nama Lengkap',
                }),
              ],
            }),
          ],
        }),
      ],
    });

  const docRows = [
    buatBarisData('Nama Lengkap', surat.nama),
    buatBarisData('ID Warga RW 10', surat.idWarga || '-'),
    buatBarisData('NIK (Diisi Manual)', '............................................................'),
    buatBarisData(
      'Alamat Domisili',
      `${blokInfo}${surat.rt} / RW 10 Perumahan Permata Hijau, Kel. Mudal, Kec. Mojotengah, Wonosobo`
    ),
    buatBarisData('Jenis Layanan', surat.jenis),
    buatBarisData('Keperluan', surat.keperluan || '-'),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1417 } },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'RUKUN WARGA 10 PERUMAHAN PERMATA HIJAU',
                bold: true,
                font: 'Times New Roman',
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'KELURAHAN MUDAL, KECAMATAN MOJOTENGAH, KABUPATEN WONOSOBO',
                bold: true,
                font: 'Times New Roman',
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: {
              bottom: { color: '000000', space: 6, style: BorderStyle.DOUBLE, size: 12 },
            },
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'Sekretariat: Gedung Serba Guna RW 10 Perumahan Permata Hijau, Mudal, Mojotengah, Wonosobo 56351',
                italics: true,
                font: 'Times New Roman',
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: (surat.jenis || 'SURAT PENGANTAR').toUpperCase(),
                bold: true,
                underline: {},
                font: 'Times New Roman',
                size: 26,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Nomor: ${noSurat}`,
                font: 'Times New Roman',
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Yang bertanda tangan di bawah ini, Pengurus Rukun Tetangga (RT) dan Rukun Warga (RW) 10 Perumahan Permata Hijau, Kelurahan Mudal, Kecamatan Mojotengah, Kabupaten Wonosobo, menerangkan bahwa:',
                font: 'Times New Roman',
                size: 24,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: docRows,
          }),
          new Paragraph({
            spacing: { before: 240, after: 400 },
            children: [
              new TextRun({
                text: 'Orang tersebut di atas adalah benar-benar warga yang berdomisili di lingkungan RW 10 Perumahan Permata Hijau. Demikian surat pengantar ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.',
                font: 'Times New Roman',
                size: 24,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: noBorder,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'Mengetahui,', font: 'Times New Roman', size: 24 }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 1000 },
                        children: [
                          new TextRun({
                            text: `Ketua ${surat.rt || 'RT'}`,
                            bold: true,
                            font: 'Times New Roman',
                            size: 24,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `( ${namaKetuaRT} )`,
                            bold: true,
                            underline: {},
                            font: 'Times New Roman',
                            size: 24,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: noBorder,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `Wonosobo, ${tglSurat}`,
                            font: 'Times New Roman',
                            size: 24,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 1000 },
                        children: [
                          new TextRun({
                            text: 'Ketua RW 10 Permata Hijau',
                            bold: true,
                            font: 'Times New Roman',
                            size: 24,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `( ${namaKetuaRW} )`,
                            bold: true,
                            underline: {},
                            font: 'Times New Roman',
                            size: 24,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (surat.nama || 'Warga').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `Surat_${surat.kode}_${safeName}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
