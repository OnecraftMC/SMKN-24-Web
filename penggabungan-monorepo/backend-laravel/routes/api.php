<?php

use App\Http\Controllers\Api\BeritaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AgendaController;
use App\Http\Controllers\Api\AspirasiController;
use App\Http\Controllers\Api\BkController;
use App\Http\Controllers\Api\BkHistoryController;
use App\Http\Controllers\Api\BkMediaController;
use App\Http\Controllers\Api\BkChatController;
use App\Http\Controllers\Api\ChatAnalyticsController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ChatInsightsController;
use App\Http\Controllers\Api\CanteenAdminController;
use App\Http\Controllers\Api\CanteenCatalogController;
use App\Http\Controllers\Api\CanteenOrdersController;
use App\Http\Controllers\Api\CanteenPaymentNotificationController;
use App\Http\Controllers\Api\CanteenSellerAuthController;
use App\Http\Controllers\Api\CanteenSellerOrdersController;
use App\Http\Controllers\Api\ChatExportController;
use App\Http\Controllers\Api\ChatHistoryController;
use App\Http\Controllers\Api\ArsipController;
use App\Http\Controllers\Api\FasilitasController;
use App\Http\Controllers\Api\EkstrakurikulerController;
use App\Http\Controllers\Api\GaleriController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\JadwalController;
use App\Http\Controllers\Api\KategoriController;
use App\Http\Controllers\Api\PengumumanController;
use App\Http\Controllers\Api\PrestasiController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login.php', [AuthController::class, 'login'])->name('api.auth.login.compatibility');
Route::get('auth/me.php', [AuthController::class, 'me'])->name('api.auth.me.compatibility');
Route::match(['GET', 'POST'], 'kategori/index.php', KategoriController::class)
    ->name('api.kategori.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'pengumuman/index.php', PengumumanController::class)
    ->name('api.pengumuman.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'berita/index.php', BeritaController::class)
    ->name('api.berita.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'agenda/index.php', AgendaController::class)
    ->name('api.agenda.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'fasilitas/index.php', FasilitasController::class)
    ->name('api.fasilitas.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'ekstrakurikuler/index.php', EkstrakurikulerController::class)
    ->name('api.ekstrakurikuler.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'guru/index.php', GuruController::class)
    ->name('api.guru.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'galeri/index.php', GaleriController::class)
    ->name('api.galeri.compatibility');
Route::match(['GET', 'POST', 'DELETE'], 'jadwal/index.php', JadwalController::class)
    ->name('api.jadwal.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'aspirasi/index.php', AspirasiController::class)
    ->name('api.aspirasi.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'bk/index.php', BkController::class)
    ->name('api.bk.compatibility');
Route::get('bk/history/index.php', BkHistoryController::class)
    ->name('api.bk.history.compatibility');
Route::get('bk/media/index.php', BkMediaController::class)
    ->name('api.bk.media.compatibility');
Route::post('bk/chat/index.php', BkChatController::class)
    ->name('api.bk.chat.compatibility');
Route::match(['GET', 'POST', 'PUT', 'DELETE'], 'arsip/index.php', ArsipController::class)
    ->name('api.arsip.compatibility');
Route::match(['GET', 'POST', 'PUT'], 'prestasi/index.php', PrestasiController::class)
    ->name('api.prestasi.compatibility');
Route::post('upload.php', UploadController::class)->name('api.upload.compatibility');
Route::get('chat/history.php', ChatHistoryController::class)->name('api.chat.history.compatibility');
Route::get('chat/analytics.php', ChatAnalyticsController::class)->name('api.chat.analytics.compatibility');
Route::get('chat/export.php', ChatExportController::class)->name('api.chat.export.compatibility');
Route::post('chat/index.php', ChatController::class)->name('api.chat.compatibility');
Route::match(['GET', 'POST', 'PUT'], 'chat/insights.php', ChatInsightsController::class)
    ->name('api.chat.insights.compatibility');
Route::post('ai/index.php', AiController::class)->name('api.ai.compatibility');
Route::get('kantin/catalog.php', CanteenCatalogController::class)->name('api.kantin.catalog.compatibility');
Route::match(['GET', 'POST', 'PUT'], 'kantin/admin.php', CanteenAdminController::class)
    ->name('api.kantin.admin.compatibility');
Route::match(['GET', 'POST'], 'kantin/orders.php', CanteenOrdersController::class)
    ->name('api.kantin.orders.compatibility');
Route::post('kantin/payment-notification.php', CanteenPaymentNotificationController::class)
    ->name('api.kantin.payment-notification.compatibility');
Route::post('kantin/seller/auth.php', CanteenSellerAuthController::class)
    ->name('api.kantin.seller.auth.compatibility');
Route::match(['GET', 'PUT'], 'kantin/seller/orders.php', CanteenSellerOrdersController::class)
    ->name('api.kantin.seller.orders.compatibility');
