import { NextResponse } from "next/server";
import { execSync } from "child_process";

interface FirewallRule {
  name: string;
  direction: string;
  action: string;
  enabled: boolean;
  protocol: string;
  localPort: string;
  remotePort: string;
}

export async function GET() {
  try {
    const output = execSync(
      `powershell -NoProfile -Command "Get-NetFirewallRule | Where-Object { $_.Enabled -eq 'True' } | ForEach-Object { $r = $_; $p = $r | Get-NetFirewallPortFilter -ErrorAction SilentlyContinue; [PSCustomObject]@{ Name=$r.DisplayName; Direction=$r.Direction.ToString(); Action=$r.Action.ToString(); Enabled=$r.Enabled.ToString(); Protocol=if($p){$p.Protocol}else{'Any'}; LocalPort=if($p){$p.LocalPort}else{'Any'}; RemotePort=if($p){$p.RemotePort}else{'Any'} } } | Select-Object -First 100 | ConvertTo-Json -Compress"`,
      { timeout: 15000, encoding: "utf8" }
    );

    let raw: Array<{
      Name: string;
      Direction: string;
      Action: string;
      Enabled: string;
      Protocol: string;
      LocalPort: string;
      RemotePort: string;
    }>;
    try {
      raw = JSON.parse(output.trim());
      if (!Array.isArray(raw)) raw = [raw];
    } catch {
      raw = [];
    }

    const rules: FirewallRule[] = raw.map((r) => ({
      name: r.Name,
      direction: r.Direction,
      action: r.Action,
      enabled: r.Enabled === "True",
      protocol: r.Protocol ?? "Any",
      localPort: r.LocalPort ?? "Any",
      remotePort: r.RemotePort ?? "Any",
    }));

    return NextResponse.json({ rules });
  } catch (e) {
    return NextResponse.json({ rules: [], error: String(e) });
  }
}
