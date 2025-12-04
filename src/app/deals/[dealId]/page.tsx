import DealContentClient from "./DealContentClient";

interface DealPageProps {
  params: Promise<{ dealId: string }>;
}

export default async function DealPage({ params }: DealPageProps) {
  const { dealId } = await params;
  return <DealContentClient dealId={dealId} />;
}
