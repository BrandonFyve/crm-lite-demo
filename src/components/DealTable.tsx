"use client";

import { useState, useMemo } from "react";
import { SimplePublicObjectWithAssociations } from "@hubspot/api-client/lib/codegen/crm/deals";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Extended type to include associated companies
interface DealWithCompanies extends SimplePublicObjectWithAssociations {
  associatedCompanies?: Array<{
    id: string;
    properties: {
      name?: string;
      createdate?: string;
      hs_object_id?: string;
    };
  }>;
}

interface DealTableProps {
  deals: SimplePublicObjectWithAssociations[];
  stages: { id: string; label: string }[];
}

type SortConfig = {
  key: keyof SimplePublicObjectWithAssociations["properties"] | "id";
  direction: "asc" | "desc";
} | null;

export default function DealTable({ deals, stages }: DealTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create a map of stage IDs to labels
  const stageMap = useMemo(() => {
    const map = new Map<string, string>();
    stages.forEach((stage) => {
      map.set(stage.id, stage.label);
    });
    return map;
  }, [stages]);

  // Sort deals
  const sortedDeals = useMemo(() => {
    if (!sortConfig) return deals;

    return [...deals].sort((a, b) => {
             let aValue: string | number = "";
       let bValue: string | number = "";

             if (sortConfig.key === "id") {
        aValue = a.id;
        bValue = b.id;
      } else {
        aValue = a.properties[sortConfig.key as keyof typeof a.properties] || "";
        bValue = b.properties[sortConfig.key as keyof typeof b.properties] || "";
      }

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle dates
      if (sortConfig.key === "createdate" || sortConfig.key === "closedate") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle numeric amount
      if (sortConfig.key === "amount") {
        aValue = parseFloat(String(aValue)) || 0;
        bValue = parseFloat(String(bValue)) || 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [deals, sortConfig]);

  // Paginate deals
  const paginatedDeals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedDeals.slice(startIndex, startIndex + pageSize);
  }, [sortedDeals, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedDeals.length / pageSize);

  const handleSort = (key: keyof DealWithCompanies["properties"] | "associatedCompanies" | "id") => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" };
        } else {
          return null; // Remove sorting
        }
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key: keyof DealWithCompanies["properties"] | "associatedCompanies" | "id") => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === "asc" ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const formatCurrency = (value: string | undefined | null) => {
    if (!value) return "N/A";
    const num = parseFloat(value);
    return isNaN(num) ? "N/A" : `R${num.toLocaleString()}`;
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const getStageLabel = (stageId: string | undefined | null) => {
    if (!stageId) return "N/A";
    return stageMap.get(stageId) || stageId;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Deals Table</CardTitle>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border rounded"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("id")}
                    className="h-8 p-0 hover:bg-transparent"
                  >
                    Record ID
                    {getSortIcon("id")}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[200px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("dealname")}
                    className="h-8 p-0 hover:bg-transparent"
                  >
                    Deal Name
                    {getSortIcon("dealname")}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[150px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("amount")}
                    className="h-8 p-0 hover:bg-transparent"
                  >
                    Amount
                    {getSortIcon("amount")}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("dealstage")}
                    className="h-8 p-0 hover:bg-transparent"
                  >
                    Deal Stage
                    {getSortIcon("dealstage")}
                  </Button>
                </TableHead>
                {/* Custom financial and lead source columns removed for demo */}
                <TableHead className="min-w-[100px]">Notes</TableHead>
                <TableHead className="min-w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("createdate")}
                    className="h-8 p-0 hover:bg-transparent"
                  >
                    Create Date
                    {getSortIcon("createdate")}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("hubspot_owner_id")}
                    className="h-8 p-0 hover:bg-transparent"
                  >
                    Deal Owner
                    {getSortIcon("hubspot_owner_id")}
                  </Button>
                </TableHead>
                {/* Custom lead and CRM fields removed for demo */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-mono text-sm">{deal.id}</TableCell>
                  <TableCell>
                    <Link 
                      href={`/deals/${deal.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {deal.properties.dealname || "Unnamed Deal"}
                    </Link>
                  </TableCell>
                  <TableCell>{formatCurrency(deal.properties.amount as string | undefined)}</TableCell>
                  <TableCell>{getStageLabel(deal.properties.dealstage)}</TableCell>
                  {/* Custom financial fields removed for demo */}
                  <TableCell>
                    <Link 
                      href={`/deals/${deal.id}#notes`}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                    >
                      View Notes
                    </Link>
                  </TableCell>
                                     <TableCell>{formatDate(deal.properties.createdate ?? undefined)}</TableCell>
                   <TableCell>{deal.properties.hubspot_owner_id || "N/A"}</TableCell>
                  {/* Custom lead and CRM fields removed for demo */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedDeals.length)} of {sortedDeals.length} deals
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
