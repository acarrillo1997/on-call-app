import { NextResponse } from 'next/server';
import swaggerSpecs from '../../../swagger.config';

export async function GET() {
  return NextResponse.json(swaggerSpecs);
} 