<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AiKnowledgeBase;

class KnowledgeBaseController extends Controller
{
    public function index()
    {
        return response()->json(AiKnowledgeBase::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'question' => 'required|string',
            'answer' => 'required|string',
        ]);

        $kb = AiKnowledgeBase::create([
            'question' => $request->question,
            'answer' => $request->answer,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Knowledge base added', 'data' => $kb], 201);
    }

    public function update(Request $request, $id)
    {
        $kb = AiKnowledgeBase::findOrFail($id);
        
        $request->validate([
            'question' => 'sometimes|required|string',
            'answer' => 'sometimes|required|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $kb->update($request->all());

        return response()->json(['message' => 'Knowledge base updated', 'data' => $kb]);
    }

    public function destroy($id)
    {
        $kb = AiKnowledgeBase::findOrFail($id);
        $kb->delete();

        return response()->json(['message' => 'Knowledge base deleted']);
    }
}
