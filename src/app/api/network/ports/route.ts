import { NextResponse } from "next/server";
import { execSync } from "child_process";

interface PortEntry {
  protocol: string;
  localAddress: string;
  localPort: number;
  state: string;
  pid: number;
}

export async function GET() {
  try {
    // PowerShell로 TCP 연결 상태 조회
    const output = execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection | Where-Object { $_.State -eq 'Listen' } | Select-Object LocalAddress,LocalPort,State,OwningProcess | ConvertTo-Json -Compress"`,
      { timeout: 5000, encoding: "utf8" }
    );

    let raw: Array<{ LocalAddress: string; LocalPort: number; State: number; OwningProcess: number }>;
    try {
      raw = JSON.parse(output.trim());
      if (!Array.isArray(raw)) raw = [raw];
    } catch {
      raw = [];
    }

    const ports: PortEntry[] = raw.map((r) => ({
      protocol: "TCP",
      localAddress: r.LocalAddress,
      localPort: r.LocalPort,
      state: "LISTEN",
      pid: r.OwningProcess,
    }));

    // 포트 번호 기준 정렬
    ports.sort((a, b) => a.localPort - b.localPort);

    return NextResponse.json({ ports });
  } catch (e) {
    return NextResponse.json({ ports: [], error: String(e) });
  }
}
