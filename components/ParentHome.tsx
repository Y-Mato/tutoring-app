export function ParentHome() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded border p-4">
        <h2 className="font-bold">次回の授業</h2>
        <p className="text-sm text-gray-500">準備中</p>
      </section>

     <section className="rounded border p-4">
        <h2 className="font-bold">最新の記録</h2>
        <p className="text-sm text-gray-500">準備中</p>
      </section>

      <section className="rounded border p-4">
        <h2 className="font-bold">今月の請求額</h2>
        <p className="text-sm text-gray-500">準備中</p>
      </section>

    </div>
  );
}
