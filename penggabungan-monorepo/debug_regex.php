<?php
$r = file_get_contents('penggabungan-monorepo/backend/knowledge-dataset.md');
preg_match_all('/^#\s+(.+?)\s*$(.*?)(?=^#\s+|\z)/ms', $r, $m, PREG_SET_ORDER);
echo "match=" . count($m) . "\n";
echo "judul[0]=" . ($m[0][1] ?? '-') . "\n";
echo "konten len[0]=" . strlen($m[0][2] ?? '') . "\n";
echo "judul[1]=" . ($m[1][1] ?? '-') . "\n";
echo "judul[113]=" . ($m[113][1] ?? '-') . "\n";
?>