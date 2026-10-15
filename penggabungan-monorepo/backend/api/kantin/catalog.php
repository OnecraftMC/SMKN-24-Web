<?php
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('GET');

$db = getDB();
$stands = $db->query("SELECT id, slug, name, description, image_url AS imageUrl FROM canteen_stands WHERE is_active = 1 ORDER BY id")->fetchAll();
$menuQuery = $db->prepare("SELECT id, stand_id AS standId, name, description, category, price, image_url AS imageUrl FROM canteen_menu_items WHERE stand_id = ? AND is_available = 1 ORDER BY sort_order, id");
foreach ($stands as &$stand) {
    $menuQuery->execute([(int)$stand['id']]);
    $stand['id'] = (int)$stand['id'];
    $stand['menu'] = $menuQuery->fetchAll();
    foreach ($stand['menu'] as &$item) {
        $item['id'] = (int)$item['id'];
        $item['standId'] = (int)$item['standId'];
        $item['price'] = (int)$item['price'];
    }
}
unset($stand, $item);
jsonResponse(['stands' => $stands, 'deliveryFee' => 4000]);
