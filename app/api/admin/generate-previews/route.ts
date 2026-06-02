import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

let isRunning = false;

export async function POST() {
  if (isRunning) {
    return NextResponse.json(
      { error: "Preview generation is already running" },
      { status: 409 }
    );
  }

  isRunning = true;

  try {
    const scriptPath = path.join(process.cwd(), "scripts", "generate-previews.js");
    const logs: string[] = [];

    const result = await new Promise<{ code: number | null; logs: string[] }>(
      (resolve) => {
        const child = spawn(process.execPath, [scriptPath], {
          cwd: process.cwd(),
        });

        child.stdout.on("data", (chunk) => {
          logs.push(String(chunk));
        });

        child.stderr.on("data", (chunk) => {
          logs.push(String(chunk));
        });

        child.on("close", (code) => {
          resolve({ code, logs });
        });
      }
    );

    return NextResponse.json({
      ok: result.code === 0,
      code: result.code,
      logs: result.logs.join("").split("\n").filter(Boolean),
    });
  } finally {
    isRunning = false;
  }
}
