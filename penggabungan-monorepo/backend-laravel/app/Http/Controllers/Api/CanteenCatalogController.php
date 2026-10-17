<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CanteenCatalogController
{
    public function __invoke(): JsonResponse
    {
        $stands = DB::table('canteen_stands')
            ->select('id', 'slug', 'name', 'description', 'image_url as imageUrl')
            ->where('is_active', 1)
            ->orderBy('id')
            ->get();

        foreach ($stands as $stand) {
            $stand->id = (int) $stand->id;
            $stand->menu = DB::table('canteen_menu_items')
                ->select('id', 'stand_id as standId', 'name', 'description', 'category', 'price', 'image_url as imageUrl')
                ->where('stand_id', $stand->id)
                ->where('is_available', 1)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(static function (object $item): object {
                    $item->id = (int) $item->id;
                    $item->standId = (int) $item->standId;
                    $item->price = (int) $item->price;

                    return $item;
                });
        }

        return response()->json(['stands' => $stands, 'deliveryFee' => 4000]);
    }
}
