import { InviteCodeIssuer } from "./InviteCodeIssuer";

export function TeacherHome() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded border p-4">
        <h2 className="font-bold">今日・今週のコマ</h2>
        <p className="text-sm text-gray-500">準備中</p>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-bold">承認待ちの申請</h2>
        <p className="text-sm text-gray-500">準備中</p>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-bold">今月の収入合計</h2>
        <p className="text-sm text-gray-500">準備中</p>
      </section>

      <InviteCodeIssuer />

    </div>
  );
}
