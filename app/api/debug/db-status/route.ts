// This route is for development only, remove in production
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Block access in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is not available in production" },
      { status: 403 }
    );
  }

  try {
    // Test database connection by performing a simple query
    const dbStatus: {
      connected: boolean;
      error: null | string | { message: string; stack?: string };
      tables: any[];
      version?: string;
      schemas?: any[];
      permissions?: any[];
    } = { 
      connected: false, 
      error: null, 
      tables: [] 
    };
    
    try {
      // Try to get list of users (or any table) to test connection
      const user = await prisma.user.findFirst();
      dbStatus.connected = true;
      
      // Try to get PostgreSQL version
      try {
        const versionResult = await prisma.$queryRaw`SELECT version()`;
        dbStatus.version = versionResult[0]?.version || 'Unknown';
      } catch (versionError) {
        console.error("Error getting database version:", versionError);
      }
      
      // Try to get list of schemas
      try {
        const schemas = await prisma.$queryRaw`
          SELECT schema_name 
          FROM information_schema.schemata
        `;
        dbStatus.schemas = schemas;
      } catch (schemaError) {
        console.error("Error getting schemas:", schemaError);
      }
      
      // Try to get table permissions
      try {
        const permissions = await prisma.$queryRaw`
          SELECT 
            table_schema, 
            table_name, 
            privilege_type 
          FROM information_schema.table_privileges 
          WHERE grantee = current_user
          LIMIT 20
        `;
        dbStatus.permissions = permissions;
      } catch (permError) {
        console.error("Error getting permissions:", permError);
      }
      
      // Get list of tables by querying information_schema
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      dbStatus.tables = tables;
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      dbStatus.error = dbError instanceof Error 
        ? { message: dbError.message, stack: dbError.stack } 
        : String(dbError);
    }

    // Get environment info
    const connectionString = process.env.DATABASE_URL || '';
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: connectionString 
        ? `${connectionString.split("://")[0]}://${connectionString.split("@")[1] || '[redacted]'}` // Hide credentials
        : null,
      // Parse parts of connection string for debugging
      dbParts: connectionString ? {
        host: connectionString.match(/@([^:]+):/)?.[1] || null,
        port: connectionString.match(/:(\d+)\//)?.[1] || null,
        database: connectionString.match(/\/([^?]+)(\?|$)/)?.[1] || null
      } : null
    };

    return NextResponse.json({
      dbStatus,
      envInfo,
      timestamp: new Date().toISOString(),
      message: "Database connection status - for debugging only"
    });
  } catch (error) {
    console.error("Debug database endpoint error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 