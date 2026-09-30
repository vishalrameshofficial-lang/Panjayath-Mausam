import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabaseIfEmpty } from '@/lib/seed-data';

export async function GET() {
  try {
    seedDatabaseIfEmpty();
    const db = getDb();
    const models = db.prepare('SELECT * FROM model_versions ORDER BY created_at DESC').all();
    
    const parsedModels = models.map((m: any) => ({
      ...m,
      metrics: JSON.parse(m.metrics_json),
      featureImportance: m.feature_importance_json ? JSON.parse(m.feature_importance_json) : null
    }));

    return NextResponse.json({ models: parsedModels });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    seedDatabaseIfEmpty();
    const db = getDb();
    const body = await request.json();
    const { modelId, role } = body;

    // RBAC validation: client-supplied role checked against server rule
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Model activation requires ADMIN or SUPER_ADMIN role.' }, { status: 403 });
    }

    if (!modelId) {
      return NextResponse.json({ error: 'modelId is required' }, { status: 400 });
    }

    const targetModel = db.prepare('SELECT * FROM model_versions WHERE id = ?').get(modelId) as any;
    if (!targetModel) {
      return NextResponse.json({ error: 'Model version not found' }, { status: 404 });
    }

    if (targetModel.status !== 'VALIDATED' && targetModel.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Cannot activate model with status '${targetModel.status}'. Model must be VALIDATED first.` }, { status: 400 });
    }

    // Deactivate current active models and set target to ACTIVE
    db.prepare("UPDATE model_versions SET status = 'RETIRED' WHERE status = 'ACTIVE'").run();
    db.prepare("UPDATE model_versions SET status = 'ACTIVE' WHERE id = ?").run(modelId);

    return NextResponse.json({
      success: true,
      message: `Model version ${targetModel.version} is now ACTIVE in production.`,
      activeModelId: modelId
    });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
