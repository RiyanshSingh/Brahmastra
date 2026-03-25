import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  FileText,
  Search,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { useReportsData } from "@/hooks/use-attendance-data";

const STATUS_CONFIG = {
  present: { label: "Present", color: "text-success bg-success/15" },
  questionable: { label: "Needs Review", color: "text-warning bg-warning/15" },
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
  const [classFilter, setClassFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const { data, isLoading } = useReportsData({
    search,
    status: statusFilter,
    classId: classFilter,
    range: dateFilter,
  });

  return (
    <AppLayout title="Reports">
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Records", value: data?.summary.total ?? 0, icon: FileText, color: "text-primary bg-primary/15" },
            { label: "Present", value: data?.summary.present ?? 0, icon: CheckCircle2, color: "text-success bg-success/15" },
            { label: "Needs Review", value: data?.summary.questionable ?? 0, icon: AlertTriangle, color: "text-warning bg-warning/15" },
            { label: "Absent", value: data?.summary.absent ?? 0, icon: XCircle, color: "text-destructive bg-destructive/15" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="dark-card rounded-2xl p-4 flex items-center gap-4"
            >
              <div className={cn("p-2.5 rounded-xl", item.color)}>
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
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
              { value: "", label: "All Classes" },
              ...(data?.classOptions ?? []).map((option) => ({
                value: option.id,
                label: option.label,
              })),
            ]}
            onChange={setClassFilter}
          />

          <SelectPill value={dateFilter} options={DATE_OPTIONS} onChange={setDateFilter} />

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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
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
                      <tr key={row.id} className="border-b border-card-border/60 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-medium text-foreground">{row.student}</td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">{row.rollNo}</td>
                        <td className="px-5 py-3.5 text-sm text-foreground">{row.classLabel}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{row.date}</td>
                        <td className="px-5 py-3.5 text-sm text-foreground">{row.checkIn}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{row.reviewedAt ?? "Not reviewed"}</td>
                        <td className="px-5 py-3.5">
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", status.color)}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{row.note ?? "—"}</td>
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
    </AppLayout>
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
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none px-4 py-2.5 bg-muted border border-card-border rounded-xl text-sm font-medium text-foreground hover:bg-muted/80 transition-colors cursor-pointer pr-8 outline-none"
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
    </div>
  );
}
