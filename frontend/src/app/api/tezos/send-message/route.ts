import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { hexMessage, rollupAddress, command } = await request.json();
    
    console.log('🔄 Executing octez-client command:', command);
    
    // Execute the octez-client command
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.error('❌ octez-client stderr:', stderr);
    }
    
    console.log('✅ octez-client stdout:', stdout);
    
    return NextResponse.json({
      success: true,
      message: 'Message sent to rollup successfully',
      stdout,
      stderr,
      hexMessage,
      rollupAddress
    });
    
  } catch (error: any) {
    console.error('❌ Error executing octez-client command:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to execute octez-client command',
      details: error.stderr || error.message
    }, { status: 500 });
  }
} 