<?php
/**
 * DocxReader — pembaca dokumen .docx (OOXML) satu-file, tanpa composer.
 *
 * Cukup unZip word/document.xml dan baca paragraf: heading dikenali dari
 * w:pStyle (Heading1..Heading4), teks dari seluruh run <w:t>. Keluaran sudah
 * dalam bentuk dokumen knowledge ala pola-A markdown:
 *
 *   $rows = DocxReader::documents('/path/file.docx', 'Judul Cadangan');
 *   // [ ['judul' => ..., 'kategori' => '', 'tags' => '', 'sumber' => '', 'konten' => ...] ]
 *
 * Batasan yang disengaja: tidak membaca tabel, kaki/catatan kaki, header.
 * Daftar isi dokumen dataset cukup heading -> teks biasa.
 */

class DocxReader
{
    /** Tinggi heading terbesar yang dianggap pemisah judul dokumen. */
    const HEADING_MAX = 3;

    /**
     * Semua paragraf: [ ['teks' => ..., 'heading' => 1..4 (0 = teks biasa)] ].
     * Return null bila file rusak / bukan docx / ZIP tidak tersedia.
     *
     * @return list<array{teks: string, heading: int}>|null
     */
    public static function paragraphs(string $path): ?array
    {
        if (!class_exists('ZipArchive')) {
            error_log('[SMKN24] Ekstensi PHP ZIP tidak aktif — .docx tidak dapat dibaca.');
            return null;
        }
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            return null;
        }
        $xmlStr = $zip->getFromName('word/document.xml');
        $zip->close();
        if ($xmlStr === false || trim($xmlStr) === '') {
            return null;
        }
        $xml = @simplexml_load_string($xmlStr);
        if ($xml === false) {
            return null;
        }

        // document.xml memakai PREFIX (biasanya w:), bukan default namespace —
        // akses properti biasa ($xml->body) selalu kosong. Daftarkan alias dan
        // cari paragraf lewat xpath; alias mengikat URI, bukan prefiks asli.
        $nsMain = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
        if (!$xml->registerXPathNamespace('w', $nsMain)) {
            return null;
        }
        $listParagraf = $xml->xpath('/w:document/w:body/w:p');
        if ($listParagraf === false) {
            return null;
        }

        $out = [];
        foreach ($listParagraf as $p) {
            $teks = '';
            // Semua <w:t> di dalam paragraf (termasuk di dalam run r, hyperlink).
            foreach ($p->xpath('.//*[local-name()="t"]') as $t) {
                $teks .= (string) $t;
            }
            $teks = preg_replace('/\s+/u', ' ', trim($teks)) ?? trim($teks);

            $heading = 0;
            $styleNodes = $p->xpath('./w:pPr/w:pStyle/@w:val');
            $style = $styleNodes !== false && count($styleNodes) > 0 ? (string) $styleNodes[0] : '';
            if (preg_match('/^Heading([1-6])$/i', $style, $m)) {
                $heading = (int) $m[1];
            } elseif ($style === 'Title' || $style === 'Judul') {
                $heading = 1;
            }

            if ($teks !== '' || $heading !== 0) {
                $out[] = ['teks' => $teks, 'heading' => $heading];
            }
        }
        return $out;
    }

    /**
     * Dokumen knowledge dari paragraf DOCX. Heading level 1..HEADING_MAX
     * memulai dokumen baru; heading lebih dalam dan teks biasa masuk konten.
     * Bila tidak ada heading, seluruh isi jadi SATU dokumen.
     */
    public static function documents(string $path, string $judulCadangan): array
    {
        $paragraf = self::paragraphs($path);
        if ($paragraf === null) {
            return [];
        }

        $rows = [];
        $judul = null;
        $konten = [];
        foreach ($paragraf as $p) {
            $buka = $p['heading'] !== 0 && $p['heading'] <= self::HEADING_MAX;
            if ($buka) {
                // Simpan dokumen yang sedang jalan.
                if ($judul !== null) {
                    $rows[] = self::documen($judul, implode("\n\n", $konten));
                }
                $judul = $p['teks'];
                $konten = [];
                continue;
            }
            if ($judul !== null && $p['teks'] !== '') {
                $konten[] = $p['teks'];
            } elseif ($judul === null) {
                // Teks sebelum heading pertama: hanya simpan jika memang bertebaran.
                $konten[] = $p['teks'];
            }
        }
        if ($judul !== null) {
            $rows[] = self::documen($judul, implode("\n\n", $konten));
        }

        if ($rows === []) {
            // Tanpa heading: satu dokumen dari seluruh isi.
            $isi = [];
            foreach ($paragraf as $p) {
                if ($p['teks'] !== '') {
                    $isi[] = $p['teks'];
                }
            }
            if ($isi !== []) {
                $rows[] = self::documen($judulCadangan, implode("\n\n", $isi));
            }
        }
        return $rows;
    }

    /** Baris JSON bentuk seragam (kategori/tags/sumber kosong = ditebak nanti). */
    private static function documen(string $judul, string $konten): array
    {
        return [
            'judul' => $judul,
            'kategori' => '',
            'tags' => '',
            'sumber' => '',
            'konten' => $konten,
        ];
    }
}
