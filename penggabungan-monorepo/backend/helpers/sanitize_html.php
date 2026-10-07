<?php
/**
 * Sanitasi HTML isi berita (editor rich-text + draf AI).
 *
 * Dipakai di dua titik (defense in depth):
 *   1. backend/api/ai/index.php  -> normaliseBeritaDraft() membersihkan `isi`
 *      hasil model sebelum dikembalikan ke form admin.
 *   2. backend/api/berita/index.php -> handleCreate/handleUpdate membersihkan
 *      `isi` sebelum INSERT/UPDATE, supaya XSS tidak bisa lolos walau payload
 *      dikirim langsung ke API tanpa lewat UI.
 *
 * Prinsip: allowlist ketat, bukan blocklist. Hanya DOMDocument bawaan PHP.
 */

const BERITA_HTML_MAX_LENGTH = 20000;

/** Tag yang dibuang BESERTA seluruh isinya. */
const BERITA_HTML_DROP_ENTIRELY = [
    'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta',
    'base', 'title', 'form', 'input', 'button', 'select', 'textarea',
    'canvas', 'applet',
];

/** Tag yang diizinkan -> atribut yang diizinkan. */
function beritaHtmlAllowedTags(): array
{
    return [
        'h1' => [], 'h2' => [], 'h3' => [], 'h4' => [], 'h5' => [], 'h6' => [],
        'p' => ['style'], 'br' => [],
        'strong' => [], 'b' => [], 'em' => [], 'i' => [],
        'u' => [], 's' => [], 'strike' => [], 'del' => [],
        'blockquote' => [], 'hr' => [],
        'ul' => [], 'ol' => [], 'li' => [],
        'a' => ['href', 'target', 'rel'],
        'img' => ['src', 'alt'],
        'span' => ['style'], 'div' => ['style'],
        'table' => [], 'thead' => [], 'tbody' => [], 'tfoot' => [],
        'tr' => [], 'th' => ['colspan', 'rowspan'], 'td' => ['colspan', 'rowspan'],
        'figure' => [], 'figcaption' => [],
    ];
}

/** Bersihkan HTML isi berita. Selalu mengembalikan string. */
function sanitizeBeritaHtml($value, int $maxLength = BERITA_HTML_MAX_LENGTH): string
{
    if (!is_string($value)) {
        return '';
    }
    $html = trim($value);
    if ($html === '') {
        return '';
    }

    $allowed = beritaHtmlAllowedTags();

    libxml_use_internal_errors(true);
    $doc = new DOMDocument('1.0', 'UTF-8');
    $wrapped = '<?xml encoding="utf-8" ?><div id="berita-sanitize-root">' . $html . '</div>';
    $loaded = $doc->loadHTML($wrapped, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    if (!$loaded) {
        return truncateBeritaHtmlText(trim(strip_tags($html)), $maxLength);
    }

    $root = $doc->getElementById('berita-sanitize-root');
    if (!$root) {
        return truncateBeritaHtmlText(trim(strip_tags($html)), $maxLength);
    }

    sanitizeBeritaNode($root, $allowed);

    $out = '';
    foreach ($root->childNodes as $child) {
        $out .= $doc->saveHTML($child);
    }
    $clean = trim($out);
    if (strlen($clean) > $maxLength * 4) {
        $clean = substr($clean, 0, $maxLength * 4);
    }
    return truncateBeritaHtmlText($clean, $maxLength);
}

/** Rekursif: bersihkan satu node dan anak-anaknya. */
function sanitizeBeritaNode(DOMNode $node, array $allowed): void
{
    $children = [];
    foreach ($node->childNodes as $child) {
        $children[] = $child;
    }

    foreach ($children as $child) {
        if ($child->nodeType === XML_COMMENT_NODE || $child->nodeType === XML_PI_NODE) {
            $node->removeChild($child);
            continue;
        }
        if ($child->nodeType !== XML_ELEMENT_NODE) {
            continue;
        }

        /** @var DOMElement $child */
        $tag = strtolower($child->tagName);

        if (in_array($tag, BERITA_HTML_DROP_ENTIRELY, true)) {
            $node->removeChild($child);
            continue;
        }

        if (!array_key_exists($tag, $allowed)) {
            sanitizeBeritaNode($child, $allowed);
            $grandchildren = [];
            foreach ($child->childNodes as $gc) {
                $grandchildren[] = $gc;
            }
            foreach ($grandchildren as $gc) {
                $node->insertBefore($gc, $child);
            }
            $node->removeChild($child);
            continue;
        }

        sanitizeBeritaAttributes($child, $tag, $allowed[$tag]);
        sanitizeBeritaNode($child, $allowed);

        if ($tag === 'b') {
            renameBeritaElement($child, 'strong');
        } elseif ($tag === 'i') {
            renameBeritaElement($child, 'em');
        } elseif ($tag === 'strike') {
            renameBeritaElement($child, 's');
        }
    }
}

/** Bersihkan atribut satu elemen sesuai allowlist. */
function sanitizeBeritaAttributes(DOMElement $el, string $tag, array $allowedAttrs): void
{
    $toRemove = [];
    foreach ($el->attributes as $attr) {
        $name = strtolower($attr->nodeName);
        if (str_starts_with($name, 'on')) {
            $toRemove[] = $attr->nodeName;
            continue;
        }
        if (!in_array($name, $allowedAttrs, true)) {
            $toRemove[] = $attr->nodeName;
        }
    }
    foreach ($toRemove as $name) {
        $el->removeAttribute($name);
    }

    if ($tag === 'a') {
        $href = trim((string)$el->getAttribute('href'));
        if ($href === '' || !isBeritaSafeHref($href)) {
            $el->removeAttribute('href');
        }
        $target = strtolower(trim((string)$el->getAttribute('target')));
        $el->removeAttribute('rel');
        if ($target === '_blank') {
            $el->setAttribute('rel', 'noopener noreferrer');
        } elseif ($target !== '' && $target !== '_self') {
            $el->removeAttribute('target');
        }
    }

    if ($tag === 'img') {
        $src = trim((string)$el->getAttribute('src'));
        if ($src === '' || !isBeritaSafeImgSrc($src)) {
            $alt = trim((string)$el->getAttribute('alt'));
            $textNode = $el->ownerDocument->createTextNode($alt);
            $el->parentNode?->replaceChild($textNode, $el);
            return;
        }
        if (!$el->hasAttribute('alt')) {
            $el->setAttribute('alt', '');
        }
    }

    if ($tag === 'th' || $tag === 'td') {
        foreach (['colspan', 'rowspan'] as $spanAttr) {
            if ($el->hasAttribute($spanAttr)) {
                $v = trim((string)$el->getAttribute($spanAttr));
                if (!preg_match('/^\d{1,3}$/', $v) || (int)$v < 1 || (int)$v > 100) {
                    $el->removeAttribute($spanAttr);
                }
            }
        }
    }

    if ($el->hasAttribute('style')) {
        $cleaned = sanitizeBeritaStyle((string)$el->getAttribute('style'));
        if ($cleaned === '') {
            $el->removeAttribute('style');
        } else {
            $el->setAttribute('style', $cleaned);
        }
    }
}

/** href aman: http/https/mailto/relatif/#. Blokir javascript:/data:/vbscript:/file:. */
function isBeritaSafeHref(string $href): bool
{
    $lower = strtolower(ltrim($href));
    foreach (['javascript:', 'data:', 'vbscript:', 'file:'] as $blocked) {
        if (str_starts_with($lower, $blocked)) {
            return false;
        }
    }
    return true;
}

/** src gambar aman: path upload internal, relatif, atau https. */
function isBeritaSafeImgSrc(string $src): bool
{
    $lower = strtolower(ltrim($src));
    foreach (['javascript:', 'data:', 'vbscript:', 'file:'] as $blocked) {
        if (str_starts_with($lower, $blocked)) {
            return false;
        }
    }
    if (str_starts_with($src, '/backend/uploads/')
        || str_starts_with($src, '/uploads/')
        || str_starts_with($lower, 'https://')
    ) {
        return true;
    }
    if (!preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:/', trim($src))) {
        return true;
    }
    return false;
}

/** style hanya boleh font-size (px/%) dan text-align. */
function sanitizeBeritaStyle(string $style): string
{
    $kept = [];
    foreach (explode(';', $style) as $decl) {
        $decl = trim($decl);
        if ($decl === '') {
            continue;
        }
        if (preg_match('/^font-size\s*:\s*\d+(\.\d+)?(px|%)$/i', $decl)) {
            $kept[] = preg_replace('/\s+/', ' ', $decl);
        } elseif (preg_match('/^text-align\s*:\s*(left|center|right|justify)$/i', $decl)) {
            $kept[] = preg_replace('/\s+/', ' ', $decl);
        }
    }
    return implode('; ', $kept);
}

/** Ganti nama elemen (b->strong, i->em) dengan memindahkan anak-anaknya. */
function renameBeritaElement(DOMElement $el, string $newTag): void
{
    $doc = $el->ownerDocument;
    $replacement = $doc->createElement($newTag);
    foreach ($el->attributes as $attr) {
        $replacement->setAttribute($attr->nodeName, $attr->nodeValue);
    }
    while ($el->firstChild) {
        $replacement->appendChild($el->firstChild);
    }
    $el->parentNode?->replaceChild($replacement, $el);
}

/** Deteksi apakah string isi mengandung HTML (untuk flag isiHtml). */
function isBeritaHtmlContent(?string $isi): bool
{
    if (!is_string($isi) || trim($isi) === '') {
        return false;
    }
    return (bool)preg_match('/<\s*(h1|h2|h3|h4|h5|h6|p|ul|ol|li|table|blockquote|img|figure|a|strong|em)\b/i', $isi);
}

function truncateBeritaHtmlText(string $text, int $maxLength): string
{
    if (function_exists('mb_strlen') && mb_strlen($text, 'UTF-8') > $maxLength) {
        return mb_substr($text, 0, $maxLength, 'UTF-8');
    }
    if (strlen($text) > $maxLength) {
        return substr($text, 0, $maxLength);
    }
    return $text;
}
