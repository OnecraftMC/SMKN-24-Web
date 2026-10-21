<?php
/**
 * SimpleXlsxReader — pembaca file .xlsx satu-file (tanpa composer).
 *
 * Diadaptasi dari pendekatan pustaka SimpleXLSX (MIT, Sergey Shuchkin) lalu
 * disederhanakan untuk kebutuhan dataset knowledge chatbot: cukup nilai sel
 * per baris per sheet tanpa styling/kolom lanjutan.
 *
 *   $sheets = SimpleXlsxReader::load('/path/file.xlsx');
 *   // [ 'Nama Sheet' => [ ['judul','kategori',...], ['...','...'], ... ] ]
 *
 * Batasan yang disengaja (dataset knowledge):
 *  - Sel tanggal serial Excel TIDAK dikonversi; tulis tanggal sebagai teks.
 *  - Formula dibaca sebagai nilai cache <v>, bukan aneka detail.
 *  - Bergantung ekstensi ZIP (ZipArchive) — sudah tersedia di semua hosting
 *    PHP 7.4+; bila tidak, load() mengembalikan null dan pemanggil
 *    memberi pesan yang jelas.
 */

class SimpleXlsxReader
{
    /** XML namespace utama SpreadsheetML (worksheet, workbook). */
    const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    /** XML namespace document relationships (rels). */
    const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

    /**
     * Baca semua sheet. Return [namaSheet => baris][kolom], atau null bila
     * file tidak valid / ekstensi ZIP tidak tersedia.
     *
     * @return array<string, list<list<string>>|null
     */
    public static function load(string $path): ?array
    {
        if (!class_exists('ZipArchive')) {
            error_log('[SMKN24] Ekstensi PHP ZIP tidak aktif — .xlsx tidak dapat dibaca.');
            return null;
        }
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            return null;
        }

        $shared = self::bacaSharedStrings($zip);
        $sheetMap = self::bacaDaftarSheet($zip);

        $hasil = [];
        foreach ($sheetMap as ['nama' => $nama, 'target' => $target]) {
            $xmlStr = $zip->getFromName($target);
            if ($xmlStr !== false && $xmlStr !== '') {
                $hasil[$nama] = self::bacaSheet($xmlStr, $shared);
            }
        }
        $zip->close();

        return $hasil;
    }

    /**
     * Tabel sharedStrings.xml -> list string. Setiap <si> bisa berisi beberapa
     * run <r><t>; gabungkan semuanya.
     */
    private static function bacaSharedStrings(ZipArchive $zip): array
    {
        $out = [];
        $xmlStr = $zip->getFromName('xl/sharedStrings.xml');
        if ($xmlStr === false || trim($xmlStr) === '') {
            return $out;
        }
        $xml = @simplexml_load_string($xmlStr);
        if ($xml === false) {
            return $out;
        }
        foreach ($xml->si as $si) {
            $teks = '';
            if (isset($si->t)) {
                $teks = (string) $si->t;
            } else {
                foreach ($si->r as $run) {
                    $teks .= (string) $run->t;
                }
            }
            $out[] = $teks;
        }
        return $out;
    }

    /**
     * Peta nama sheet -> path worksheet dari workbook.xml + workbook.xml.rels.
     */
    private static function bacaDaftarSheet(ZipArchive $zip): array
    {
        $out = [];
        $wb = @simplexml_load_string((string) $zip->getFromName('xl/workbook.xml'));
        $rels = @simplexml_load_string((string) $zip->getFromName('xl/_rels/workbook.xml.rels'));
        if ($wb === false || $rels === false) {
            return $out;
        }

        // id rel -> Target (fabsolut: "worksheets/sheet1.xml" relatif ke xl/).
        $relMap = [];
        foreach ($rels->Relationship as $rel) {
            $relMap[(string) $rel['Id']] = (string) $rel['Target'];
        }

        foreach ($wb->sheets->sheet as $sheet) {
            $rid = (string) $sheet->attributes(self::NS_REL)->id;
            $nama = trim((string) $sheet['name']);
            $target = $relMap[$rid] ?? '';
            if ($target === '') {
                continue;
            }
            $target = ltrim(str_replace('\\', '/', $target), '/');
            if (!str_starts_with($target, 'xl/')) {
                $target = 'xl/' . $target;
            }
            $out[] = ['nama' => $nama !== '' ? $nama : 'Sheet', 'target' => $target];
        }
        return $out;
    }

    /**
     * Sheet XML -> baris array nilai. Sel kosong (refs non-sekuensial)
     * menjaga posisi baris dengan kolom huruf, bukan urutan kemunculan.
     */
    private static function bacaSheet(string $xmlStr, array $shared): array
    {
        $xml = @simplexml_load_string($xmlStr);
        if ($xml === false || !isset($xml->sheetData)) {
            return [];
        }

        $out = [];
        foreach ($xml->sheetData->row as $row) {
            $baris = [];
            $kolomHarapan = 0;
            foreach ($row->c as $c) {
                $ref = (string) $c['r'];
                $idx = $ref !== '' ? self::hurufKeKolom($ref) : $kolomHarapan;
                // Isi lubang sel kosong agar kolom tetap lurus.
                while ($kolomHarapan < $idx) {
                    $baris[$kolomHarapan++] = '';
                }
                $tipe = (string) $c['t'];
                $nilai = '';
                if ($tipe === 'inlineStr') {
                    foreach ($c->is->t as $t) {
                        $nilai .= (string) $t;
                    }
                } elseif ($tipe === 's') {
                    $idxShared = (int) (string) ($c->v ?? '-1');
                    $nilai = $shared[$idxShared] ?? '';
                } else {
                    $nilai = (string) ($c->v ?? '');
                }
                $baris[$kolomHarapan++] = trim($nilai);
            }
            if ($baris !== [] && implode('', array_values($baris)) !== '') {
                $out[] = array_values($baris);
            }
        }
        return $out;
    }

    /** "BC12" -> 28 (0-based index kolom dari huruf refs). */
    private static function hurufKeKolom(string $ref): int
    {
        $huruf = 0;
        $panjang = strlen($ref);
        for ($i = 0; $i < $panjang && $ref[$i] >= 'A' && $ref[$i] <= 'Z'; $i++) {
            $huruf = $huruf * 26 + (ord($ref[$i]) - 64);
        }
        return $huruf - 1;
    }
}
