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
} from "lucide-react";
import * as XLSX from "xlsx";
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

  const handleExportPresent = () => {
    if (!data?.records) return;

    // Filter only present students from current view
    const presentRecords = data.records.filter(r => r.status === 'present');

    if (presentRecords.length === 0) {
      alert("No 'Present' records found for the current filters.");
      return;
    }

    const exportData = presentRecords.map(r => ({
      'Student Name': r.student,
      'Roll No.': r.rollNo,
      'Class': r.classLabel,
      'Date': r.date,
      'Punch Time': r.checkIn,
      'Review Time': r.reviewedAt || 'N/A',
      'Status': 'Present',
      'Notes': r.note || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Present Students");

    // Standard filename with filters info
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Present_Students_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Records", value: data?.summary.total ?? 0, icon: FileText, color: "bg-primary/10 text-primary border-primary/20" },
            { label: "Present Records", value: data?.summary.present ?? 0, icon: CheckCircle2, color: "bg-success/10 text-success border-success/20" },
            { label: "Needs Audit", value: data?.summary.questionable ?? 0, icon: AlertTriangle, color: "bg-warning/10 text-warning border-warning/20" },
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
              { value: "questionable", label: "Needs Review" },
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

          <button
            onClick={handleExportPresent}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
          >
            <Download className="w-3.5 h-3.5" />
            Download Present
          </button>

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
                  {["Student", "Roll No.", "Class", "Date", "Punch", "Reviewed", "Status", "Note"].map((column) => (
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
                      <td colSpan={8} className="px-5 py-4">
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
                           <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground opacity-50 mt-0.5">{row.rollNo}</div>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-muted-foreground">{row.classLabel}</td>
                        <td className="px-5 py-4 text-xs font-medium text-muted-foreground">{row.date}</td>
                        <td className="px-5 py-4 text-xs font-mono text-foreground font-bold">{row.checkIn}</td>
                        <td className="px-5 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{row.reviewedAt ?? "—"}</td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border", 
                            status.color
                          )}>
                            <div className={cn("w-1 h-1 rounded-full", status.color.split(' ')[0].replace('text-', 'bg-'))} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground italic">{row.note ?? "—"}</td>
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
