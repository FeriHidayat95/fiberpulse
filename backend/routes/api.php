<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OdpController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ApiKeyController;
use App\Http\Controllers\Api\WebhookController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/me', [AuthController::class, 'me']);

// CRM Chat Routes
Route::get('/chats', [\App\Http\Controllers\Api\ChatController::class, 'getConversations']);
Route::post('/chats/takeover-all-ai', [\App\Http\Controllers\Api\ChatController::class, 'takeoverAllAi']);
Route::post('/chats/clear-all', [\App\Http\Controllers\Api\ChatController::class, 'clearAll']);
Route::get('/chats/{id}', [\App\Http\Controllers\Api\ChatController::class, 'getMessages']);
Route::post('/chats/{id}/message', [\App\Http\Controllers\Api\ChatController::class, 'sendMessage']);
Route::post('/chats/{id}/toggle-ai', [\App\Http\Controllers\Api\ChatController::class, 'toggleAi']);

// Knowledge Base Routes
Route::apiResource('knowledge-base', \App\Http\Controllers\Api\KnowledgeBaseController::class);

// Media Library Routes
Route::get('/media-files', [\App\Http\Controllers\Api\MediaController::class, 'index']);
Route::post('/media-files', [\App\Http\Controllers\Api\MediaController::class, 'store']);
Route::delete('/media-files/{filename}', [\App\Http\Controllers\Api\MediaController::class, 'destroy']);

// User & Account Management API
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::patch('/users/{id}/status', [UserController::class, 'updateStatus']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Dashboard Summary API
Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
Route::get('/dashboard/inventory', [DashboardController::class, 'inventory']);

// ODP GIS & Management API
Route::get('/odps/{id}/ports', [OdpController::class, 'ports']);
Route::apiResource('/odps', OdpController::class);

// Technician Field Workflow API
Route::apiResource('/tasks', TaskController::class);
Route::post('/tasks/{id}/start', [TaskController::class, 'startTask']);
Route::post('/tasks/{id}/complete', [TaskController::class, 'completeTask']);
Route::post('/tasks/{id}/escalate', [TaskController::class, 'reportEscalation']);

// Asset & Warehouse Inventory API
Route::get('/assets', [AssetController::class, 'index']);
Route::post('/assets', [AssetController::class, 'store']);
Route::get('/assets/pending-handovers', [AssetController::class, 'getPendingHandovers']);
Route::post('/assets/receive-handover', [AssetController::class, 'receiveHandover']);
Route::get('/assets/{id}/items', [AssetController::class, 'getAssetItems']);
Route::get('/assets/transactions', [AssetController::class, 'transactions']);
Route::get('/asset-transactions', [AssetController::class, 'transactions']);
Route::put('/assets/transactions/{id}', [AssetController::class, 'updateTransaction']);
Route::delete('/assets/transactions/{id}', [AssetController::class, 'destroyTransaction']);
Route::post('/assets/add-stock', [AssetController::class, 'addStock']);
Route::post('/assets/take', [AssetController::class, 'takeAsset']);
Route::post('/assets/report-damaged', [AssetController::class, 'reportDamaged']);
Route::post('/assets/scrap-damaged', [AssetController::class, 'scrapDamaged']);
Route::post('/assets/upload-photo', [AssetController::class, 'uploadAssetPhoto']);
Route::get('/assets/check-serial', [AssetController::class, 'checkSerial']);
Route::post('/assets/serial-update', [AssetController::class, 'updateSerial']);
Route::match(['put', 'post'], '/assets/serials/{id}', [AssetController::class, 'updateSerial']);
Route::get('/assets/{id}', [AssetController::class, 'show']);
Route::put('/assets/{id}', [AssetController::class, 'update']);
Route::patch('/assets/{id}', [AssetController::class, 'update']);
Route::delete('/assets/{id}', [AssetController::class, 'destroy']);

// Customer & Order Registration API
Route::apiResource('/customers', CustomerController::class);
Route::patch('/customers/{id}/status', [CustomerController::class, 'updateStatus']);

Route::apiResource('/orders', OrderController::class);
Route::post('/orders/auto-dispatch', [OrderController::class, 'autoDispatch']);
Route::post('/orders/{id}/convert-to-task', [OrderController::class, 'convertToTask']);
Route::post('/orders/{id}/assign', [OrderController::class, 'assignOrder']);
Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);

// AI Settings API
Route::get('/api-keys/global-status', [ApiKeyController::class, 'getGlobalStatus']);
Route::post('/api-keys/global-status', [ApiKeyController::class, 'toggleGlobalStatus']);
Route::get('/api-keys/instance-name', [ApiKeyController::class, 'getInstanceName']);
Route::post('/api-keys/instance-name', [ApiKeyController::class, 'updateInstanceName']);
Route::get('/api-keys/ignored-numbers', [ApiKeyController::class, 'getIgnoredNumbers']);
Route::post('/api-keys/ignored-numbers', [ApiKeyController::class, 'updateIgnoredNumbers']);
Route::get('/api-keys/group-response-config', [ApiKeyController::class, 'getGroupResponseConfig']);
Route::post('/api-keys/group-response-config', [ApiKeyController::class, 'updateGroupResponseConfig']);
Route::get('/api-keys/handover-duration', [ApiKeyController::class, 'getHandoverDuration']);
Route::post('/api-keys/handover-duration', [ApiKeyController::class, 'updateHandoverDuration']);
Route::get('/api-keys/evolution-config', [ApiKeyController::class, 'getEvolutionConfig']);
Route::post('/api-keys/evolution-config', [ApiKeyController::class, 'updateEvolutionConfig']);
Route::get('/api-keys/evo-config', [ApiKeyController::class, 'getEvolutionConfig']);
Route::post('/api-keys/evo-config', [ApiKeyController::class, 'updateEvolutionConfig']);
Route::get('/api-keys/triage-config', [ApiKeyController::class, 'getTriageConfig']);
Route::post('/api-keys/triage-config', [ApiKeyController::class, 'updateTriageConfig']);
Route::get('/api-keys/advanced-config', [ApiKeyController::class, 'getAiAdvancedConfig']);
Route::put('/api-keys/advanced-config', [ApiKeyController::class, 'updateAiAdvancedConfig']);
Route::apiResource('/api-keys', ApiKeyController::class);
Route::post('/api-keys/reset-errors', [ApiKeyController::class, 'resetErrors']);
Route::post('/ai/simulate', [ApiKeyController::class, 'simulate']);
Route::post('/ai/test-suite', [ApiKeyController::class, 'testSuite']);

// Evolution API Proxy Routes
Route::get('/evolution/status', [\App\Http\Controllers\Api\EvolutionController::class, 'status']);
Route::get('/evolution/qr', [\App\Http\Controllers\Api\EvolutionController::class, 'qr']);
Route::post('/evolution/pairing-code', [\App\Http\Controllers\Api\EvolutionController::class, 'pairingCode']);
Route::post('/evolution/logout', [\App\Http\Controllers\Api\EvolutionController::class, 'logout']);
Route::get('/evolution/groups', [\App\Http\Controllers\Api\EvolutionController::class, 'getGroups']);

// Webhook Evolution API (Public, No Sanctum Auth)
Route::post('/webhook/evolution', [WebhookController::class, 'evolution']);
