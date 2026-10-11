"use client";

import { useState, useEffect, use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  BadgeAlert,
  Loader2,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GuestDocument, GuestStatus } from "@/domain/types";
import { toast } from "sonner";
import { selectedGuestsCsv } from "@/lib/guest-export";

export default function GuestLibraryPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    organization: ""
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: result, isLoading, isError, refetch } = useQuery({
    queryKey: ["guests", eventId, debouncedSearch, statusFilter, page],
    queryFn: async ({signal}) => {
      const url = new URL(`/pahchaan/api/events/${eventId}/guests`, window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "50");
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      
      const res = await fetch(url.toString(), {signal});
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return {guests: json.data as GuestDocument[], meta: json.meta as {total: number; totalPages: number; page: number; limit: number}};
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    staleTime: 10000,
    refetchOnWindowFocus: true
  });

  const data = result?.guests;
  const changePage = (next: number) => {setPage(next); setSelectedGuests(new Set());};

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedGuests);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedGuests(newSet);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedGuests.size === 0) return;
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestIds: Array.from(selectedGuests),
          status: action
        })
      });
      if (res.ok) {
        toast.success(`Successfully updated ${selectedGuests.size} guests`);
        setSelectedGuests(new Set());
        refetch();
      }
    } catch (e) {
      toast.error("Bulk action failed");
    }
  };

  const handleNotifyAction = async (guestIds: string[]) => {
    if (guestIds.length === 0) return;
    setIsNotifying(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully sent invitations to ${data.count} guests`);
        setSelectedGuests(new Set());
        refetch();
      } else {
        toast.error(data.error || "Failed to send notifications");
      }
    } catch (e) {
      toast.error("Failed to send notifications");
    } finally {
      setIsNotifying(false);
    }
  };

  const handleQuickCheckIn = async (guestId: string) => {
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/scanner/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, direction: "in" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Guest checked in and verified successfully!");
        refetch();
      } else {
        toast.error(data.reason || "Failed to check in");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to check in");
    }
  };

  const handleExportSelected = () => {
    try {
      const { csv, count } = selectedGuestsCsv(data ?? [], selectedGuests);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `guests_${eventId}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Allow the browser to start the download before releasing its URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Export started for ${count} guest${count === 1 ? "" : "s"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export guests. Please try again.");
    }
  };

  const handleSingleAction = async (guestId: string, action: string) => {
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestIds: [guestId],
          status: action
        })
      });
      if (res.ok) {
        if (action === "approved") {
          toast.success("Guest approved and QR Badge assigned!");
        } else {
          toast.success("Guest updated successfully");
        }
        refetch();
      } else {
        toast.error("Action failed");
      }
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const StatusBadge = ({ status }: { status: GuestStatus }) => {
    const styles = {
      approved: "bg-green-500/10 text-green-600 dark:text-green-400",
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
      checked_in: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      default: "bg-muted text-muted-foreground"
    };
    const style = styles[status as keyof typeof styles] || styles.default;
    
    return (
      <Badge variant="outline" className={`capitalize ${style} border-transparent`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add guest");
      
      toast.success("Guest added successfully!");
      setIsAddModalOpen(false);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", title: "", organization: "" });
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guest Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your attendee lifecycle and registration data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/events/${eventId}/guests/import`}>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Import Guests
            </Button>
          </Link>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="sm:max-w-2xl p-6 sm:p-8 rounded-3xl">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold">Add New Guest</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Enter the guest&apos;s details manually. They will be added to the library with a Pending status.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddGuest} className="space-y-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name *</Label>
                    <Input id="firstName" required className="h-11 rounded-xl bg-background" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} placeholder="First name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</Label>
                    <Input id="lastName" className="h-11 rounded-xl bg-background" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} placeholder="Last name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address *</Label>
                    <Input id="email" type="email" required className="h-11 rounded-xl bg-background" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number (Optional)</Label>
                    <Input id="phone" className="h-11 rounded-xl bg-background" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role / Title (Optional)</Label>
                    <Input id="title" className="h-11 rounded-xl bg-background" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Lead Engineer" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="organization" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company / Organization (Optional)</Label>
                    <Input id="organization" className="h-11 rounded-xl bg-background" value={formData.organization} onChange={e => setFormData({ ...formData, organization: e.target.value })} placeholder="e.g. Acme Corp" />
                  </div>
                </div>
                <DialogFooter className="pt-4 gap-2">
                  <Button type="button" variant="outline" className="h-11 px-5 rounded-xl cursor-pointer" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="h-11 px-6 rounded-xl font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 cursor-pointer shadow-sm" disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add Guest"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/30">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email, or company..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); setSelectedGuests(new Set()); }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 border-dashed">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <select 
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelectedGuests(new Set()); }}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="checked_in">Checked In</option>
            </select>
          </div>
        </div>

        {selectedGuests.size > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <span className="text-sm font-medium px-2">
              {selectedGuests.size} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 text-xs font-medium focus-visible:outline-none">
                More Actions
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkAction("approved")}>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Approve All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("rejected")}>
                  <XCircle className="w-4 h-4 mr-2 text-red-500" /> Reject All
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  handleNotifyAction(Array.from(selectedGuests));
                }} disabled={isNotifying}>
                  {isNotifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Inbox className="w-4 h-4 mr-2" />}
                  Send Invitations & Badges
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportSelected}>
                  <Download className="w-4 h-4 mr-2" /> Export Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto rounded-md border border-border/50 shadow-sm bg-background">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-4 bg-muted animate-pulse rounded" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 bg-muted animate-pulse rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="w-32 h-4 bg-muted animate-pulse rounded" />
                    <div className="w-48 h-3 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="w-32 h-4 bg-muted animate-pulse rounded" />
                <div className="w-24 h-6 bg-muted animate-pulse rounded-full" />
                <div className="w-8 h-8 bg-muted animate-pulse rounded-md ml-auto" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center" role="alert">Could not load guests. <Button variant="outline" onClick={() => refetch()}>Try again</Button></div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-12 m-8 rounded-xl border border-border/50 border-dashed bg-muted/10 min-h-[400px]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-background mb-6 shadow-sm border border-border/50">
              <Inbox className="w-10 h-10 text-primary/80" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">No Guests Yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed mb-8">
              Start building your guest list to generate QR badges, manage check-ins, and track attendance.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => setIsAddModalOpen(true)}>Add Guest Manually</Button>
              <Link href={`/events/${eventId}/guests/import`}>
                <Button variant="outline" className="bg-background">Import CSV</Button>
              </Link>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 w-12 text-center">
                  <input 
                    type="checkbox" 
                    aria-label="Select all guests"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGuests(new Set(data.map(g => g._id as string)));
                      } else {
                        setSelectedGuests(new Set());
                      }
                    }}
                    checked={data.length > 0 && data.every(guest => selectedGuests.has(String(guest._id)))}
                  />
                </th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Check-ins</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((guest) => (
                <tr 
                  key={guest._id as string} 
                  className={`hover:bg-muted/30 transition-colors ${selectedGuests.has(guest._id as string) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      aria-label={`Select ${guest.firstName} ${guest.lastName}`}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedGuests.has(guest._id as string)}
                      onChange={() => toggleSelect(guest._id as string)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-medium text-secondary-foreground shrink-0">
                        {guest.firstName.charAt(0)}{guest.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {guest.firstName} {guest.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{guest.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {guest.organization || "-"}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={guest.status} />
                  </td>
                  <td className="px-4 py-4">
                    {guest.checkIns && guest.checkIns.length > 0 ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-xs">
                        {guest.checkIns.length} scan{guest.checkIns.length === 1 ? '' : 's'}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium pl-1">0</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleQuickCheckIn(guest._id as string)} className="text-emerald-600 font-medium">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Check In / Scan
                        </DropdownMenuItem>
                        <Link href={`/events/${eventId}/guests/${guest._id}`}>
                          <DropdownMenuItem>
                            View Profile
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleSingleAction(guest._id as string, "approved")}>
                          Assign QR Badge
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNotifyAction([guest._id as string])} disabled={isNotifying}>
                          Send Invitation & Badge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {result && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4" aria-label="Guest pagination">
          <p className="text-sm text-muted-foreground" aria-live="polite">{result.meta.total} guests · Page {page} of {Math.max(1, result.meta.totalPages)}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={isLoading || page <= 1} onClick={() => changePage(page - 1)}>Previous page</Button>
            <Button variant="outline" disabled={isLoading || page >= result.meta.totalPages} onClick={() => changePage(page + 1)}>Next page</Button>
          </div>
        </div>
      )}
    </div>
  );
}
