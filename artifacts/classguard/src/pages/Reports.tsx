import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  FileText,
  Search,
  AlertTriangle,
  XCircle,
  Download,
  PlusCircle,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitManualAttendance } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { useReportsData } from "@/hooks/use-attendance-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_CONFIG = {
  present: { label: "Present", color: "text-[#15803d] dark:text-success bg-success/15" },
  questionable: { label: "Needs Review", color: "text-[#92400e] dark:text-warning bg-warning/15" },
  absent: { label: "Absent", color: "text-destructive bg-destructive/15" },
} as const;

const DATE_OPTIONS = [
  { label: "All Dates", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7" },
  { label: "Last 30 Days", value: "last30" },
];

export default function Reports() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const { data, isLoading } = useReportsData({
    search,
    status: statusFilter,
    classId: classFilter === "all" ? "" : classFilter,
    range: dateFilter,
  });

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualRoll, setManualRoll] = useState("");
  const [manualClassId, setManualClassId] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const manualMutation = useMutation({
    mutationFn: async () => {
      if (!manualName.trim() || !manualRoll.trim() || !manualClassId) {
        throw new Error("All fields are required");
      }
      return submitManualAttendance(manualClassId, {
        studentName: manualName,
        rollNo: manualRoll
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setIsManualOpen(false);
      setManualName("");
      setManualRoll("");
      toast({
        title: "Attendance marked",
        description: `Manually added ${manualName} to the latest session.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark attendance",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const exportToExcel = (records: any[], typeName: string) => {
    if (records.length === 0) {
      alert(`No records found for '${typeName}' with current filters.`);
      return;
    }

    const exportData = records.map(r => ({
      'Student Name': r.student,
      'Roll No.': r.rollNo,
      'Class': r.classLabel,
      'Date': r.date,
      'Punch Time': r.checkIn,
      'Status': r.status.charAt(0).toUpperCase() + r.status.slice(1)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, typeName);

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${typeName.replace(/ /g, '_')}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const handleExportPresent = () => {
    const presentRecords = (data?.records ?? []).filter(r => r.status === 'present');
    exportToExcel(presentRecords, "Present Students");
  };

  const handleExportAbsent = () => {
    const absentRecords = (data?.records ?? []).filter(r => r.status === 'absent');
    exportToExcel(absentRecords, "Absent Students");
  };

  const handleExportAll = () => {
    exportToExcel(data?.records ?? [], "All Records");
  };

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Records", value: data?.summary.total ?? 0, icon: FileText, color: "bg-primary/10 text-primary border-primary/20" },
            { label: "Present Records", value: data?.summary.present ?? 0, icon: CheckCircle2, color: "bg-success/10 text-success border-success/20" },
            { label: "Absent Total", value: data?.summary.absent ?? 0, icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="dark-card border border-border rounded-[1.5rem] p-5 flex items-center gap-4 group transition-all duration-300 hover:shadow-2xl hover:shadow-black/20"
            >
              <div className={cn("p-3 rounded-2xl relative overflow-hidden shrink-0", item.color)}>
                <item.icon className="w-5 h-5 relative z-10" />
              </div>
              <div className="min-w-0">
                <div className="text-3xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors leading-none">{item.value}</div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-60 mt-1 truncate">{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="dark-card rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-center"
        >
          <div className="flex items-center dark-card-elevated rounded-xl px-3.5 py-2.5 flex-1 min-w-[160px] max-w-xs gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground text-foreground"
            />
          </div>

          <SelectPill
            value={statusFilter}
            options={[
              { value: "all", label: "All Status" },
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
            ]}
            onChange={setStatusFilter}
          />

          <SelectPill
            value={classFilter}
            options={[
              { value: "all", label: "All Classes" },
              ...(data?.classOptions ?? []).map((option) => ({
                value: option.id,
                label: option.label,
              })),
            ]}
            onChange={setClassFilter}
          />

          <SelectPill value={dateFilter} options={DATE_OPTIONS} onChange={setDateFilter} />

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsManualOpen(true)}
              className="px-4 h-10 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-bold flex items-center gap-2 hover:bg-orange-500/20 transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Manual Entry
            </button>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-border bg-card/95 backdrop-blur-md shadow-2xl p-1.5">
              <DropdownMenuItem 
                onClick={handleExportAll}
                className="rounded-lg text-xs font-bold py-2.5 cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors gap-2"
              >
                <FileText className="w-3.5 h-3.5" />
                Download All
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportPresent}
                className="rounded-lg text-xs font-bold py-2.5 cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Download Present
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportAbsent}
                className="rounded-lg text-xs font-bold py-2.5 cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors gap-2 text-destructive focus:text-destructive"
              >
                <XCircle className="w-3.5 h-3.5" />
                Download Absent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

          <span className="ml-auto text-xs text-muted-foreground font-medium">
            {data?.records.length ?? 0} record{(data?.records.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="dark-card rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto relative max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="sticky top-0 z-20 bg-card/95 backdrop-blur-md shadow-sm">
                <tr className="border-b border-card-border">
                  {["Student", "Roll No.", "Class", "Date", "Punch", "Status"].map((column) => (
                    <th
                      key={column}
                      className="px-5 py-3.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index} className="border-b border-card-border/60">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-10 rounded-xl bg-muted/40 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : (
                  data?.records.map((row) => {
                    const status = STATUS_CONFIG[row.status];
                    return (
                      <tr key={row.id} className="border-b border-border hover:bg-muted/10 transition-colors group">
                        <td className="px-5 py-4">
                           <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{row.student}</div>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-muted-foreground">{row.rollNo}</td>
                        <td className="px-5 py-4 text-xs font-bold text-muted-foreground">{row.classLabel}</td>
                        <td className="px-5 py-4 text-xs font-medium text-muted-foreground">{row.date}</td>
                        <td className="px-5 py-4 text-xs font-mono text-foreground font-bold">{row.checkIn}</td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border", 
                            status.color
                          )}>
                            <div className={cn("w-1 h-1 rounded-full", status.color.split(' ')[0].replace('text-', 'bg-'))} />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {!isLoading && (data?.records.length ?? 0) === 0 && (
              <div className="py-14 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No records match your filters.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card backdrop-blur-2xl border-border p-0 overflow-hidden rounded-[32px] shadow-2xl">
          <div className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-primary" strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-white">Manual Attendance</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Add a student record manually for the latest session.</DialogDescription>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Select Class</Label>
                <Select value={manualClassId} onValueChange={setManualClassId}>
                  <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-border">
                    <SelectValue placeholder="Which class?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-card">
                    {(data?.classOptions ?? []).map((option) => (
                      <SelectItem key={option.id} value={option.id} className="rounded-xl">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Student Name</Label>
                  <Input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="h-12 rounded-2xl bg-muted/20 border-border"
                    placeholder="e.g. Bittu Kumar"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Enrollment / Roll No.</Label>
                  <Input
                    value={manualRoll}
                    onChange={(e) => setManualRoll(e.target.value.toUpperCase())}
                    className="h-12 rounded-2xl bg-muted/20 border-border"
                    placeholder="e.g. 0111AS211001"
                  />
                </div>
              </div>

              <Button
                onClick={() => manualMutation.mutate()}
                disabled={manualMutation.isPending}
                className="w-full h-12 rounded-2xl bg-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                {manualMutation.isPending ? "Adding..." : "Mark as Present"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SelectPill({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] h-10 rounded-xl bg-muted border border-card-border px-4 text-sm font-medium text-foreground hover:bg-muted/80 transition-all outline-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl border border-card-border bg-card shadow-2xl">
        {options.map((option) => (
          <SelectItem 
            key={option.value || option.label} 
            value={option.value}
            className="rounded-lg focus:bg-primary transition-colors cursor-pointer"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
