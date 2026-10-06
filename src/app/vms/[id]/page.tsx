import { VmPowerPanel } from "@/components/VmPowerPanel";
import { NotesEditor } from "@/components/NotesEditor";
import { listVms } from "@/lib/vmrest";

export default async function VmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let vmName = id;
  try {
    const vms = await listVms();
    const vm = vms.find((v) => v.id === id);
    if (vm) {
      vmName = vm.path.split(/[\\/]/).pop()?.replace(/\.vmx$/i, "") ?? id;
    }
  } catch {
    // vmrest 미응답 시 id를 이름으로 fallback
  }

  return (
    <>
      <VmPowerPanel vmId={id} vmName={vmName} />
      <NotesEditor vmId={id} />
    </>
  );
}
