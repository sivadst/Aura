import Link from "next/link";
import { Inbox, FileText, CheckCircle, Book, Settings } from "lucide-react";

export function Sidebar() {
  return (
    <div className="w-64 border-r bg-background h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Aura</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/inbox" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
          <Inbox size={20} /> Inbox
        </Link>
        <Link href="/drafts" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
          <FileText size={20} /> Drafts
        </Link>
        <Link href="/approvals" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
          <CheckCircle size={20} /> Approvals
        </Link>
        <Link href="/knowledge" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
          <Book size={20} /> Knowledge
        </Link>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
          <Settings size={20} /> Settings
        </Link>
      </nav>
    </div>
  );
}
