import { NextResponse } from 'next/server';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { role } = body;

    if (role !== 'DATA_ANALYST' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Model retraining requires DATA_ANALYST, ADMIN, or SUPER_ADMIN role.' }, { status: 403 });
    }

    const scriptPath = path.join(process.cwd(), 'ml', 'train_downscaler.py');
    const { stdout, stderr } = await execPromise(`python "${scriptPath}"`);

    return NextResponse.json({
      success: true,
      message: 'Model training and validation pipeline completed successfully.',
      output: stdout,
      errors: stderr || null
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: 'Training failed: ' + (err?.message || 'Execution error')
    }, { status: 500 });
  }
}
