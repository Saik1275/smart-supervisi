import { Suspense } from "react";
import { DetailPage } from "../../../components/supervisi/pages/DetailPage";

async function DetailRouteContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailPage id={id} />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          Memuat lembar hasil supervisi…
        </div>
      }
    >
      <DetailRouteContent params={params} />
    </Suspense>
  );
}
