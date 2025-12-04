import TicketContentClient from "./TicketContentClient";

interface TicketPageProps {
  params: Promise<{ ticketId: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { ticketId } = await params;

  return <TicketContentClient ticketId={ticketId} />;
}


