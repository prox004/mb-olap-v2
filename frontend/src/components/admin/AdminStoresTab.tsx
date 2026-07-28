"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { apiClient } from "@/utils/apiClient";
import {
  LocationOption,
  useOlapFilter,
} from "@/context/OlapFilterContext";

export default function AdminStoresTab() {
  const { availableStores, isLoadingLocations } = useOlapFilter();
  const [locations, setLocations] = useState<LocationOption[]>(availableStores);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // New / Edit Form State
  const [admsiteCode, setAdmsiteCode] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [siteType, setSiteType] = useState<string>("RETAIL_STORE");
  const [editingCode, setEditingCode] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setLocations(availableStores);
  }, [availableStores]);

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.admsite_code.toString().includes(searchQuery)
  );

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admsiteCode || !locationName) {
      setStatusMessage({ type: "error", text: "Please enter both AdmSite Code and Location Name." });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);
      const codeNum = parseInt(admsiteCode, 10);

      if (editingCode !== null) {
        // UPDATE EXISTING STORE
        const res = await apiClient<{ success: boolean; message: string }>(`/locations/${editingCode}`, {
          method: "PUT",
          body: JSON.stringify({
            name: locationName.trim(),
            site_type: siteType,
          }),
          headers: { "Content-Type": "application/json" },
        });
        if (res.success) {
          setStatusMessage({ type: "success", text: res.message || "Store updated successfully!" });
          resetForm();
          setTimeout(() => window.location.reload(), 1000);
        } else {
          setStatusMessage({ type: "error", text: res.message || "Failed to update store." });
        }
      } else {
        // CREATE NEW STORE
        const res = await apiClient<{ success: boolean; message: string }>("/locations", {
          method: "POST",
          body: JSON.stringify({
            admsite_code: codeNum,
            name: locationName.trim(),
            site_type: siteType,
          }),
          headers: { "Content-Type": "application/json" },
        });
        if (res.success) {
          setStatusMessage({ type: "success", text: res.message || "Store added successfully!" });
          resetForm();
          setTimeout(() => window.location.reload(), 1000);
        } else {
          setStatusMessage({ type: "error", text: res.message || "Failed to add store." });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (loc: LocationOption) => {
    setEditingCode(loc.admsite_code);
    setAdmsiteCode(loc.admsite_code.toString());
    setLocationName(loc.name);
    setSiteType(loc.site_type || "RETAIL_STORE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (code: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete store ${name} (ID: ${code})?`)) return;

    try {
      setIsSubmitting(true);
      const res = await apiClient<{ success: boolean; message: string }>(`/locations/${code}`, {
        method: "DELETE",
      });
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message || "Store deleted successfully!" });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setStatusMessage({ type: "error", text: res.message || "Failed to delete store." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to delete store." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingCode(null);
    setAdmsiteCode("");
    setLocationName("");
    setSiteType("RETAIL_STORE");
  };

  return (
    <div className="space-y-6">
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900 shadow-xs">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                {editingCode !== null ? `Edit Store #${editingCode}` : "Add New Store Outlet"}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Scalable up to 250+ store outlets. Saves directly to `dim_locations.parquet` & DuckDB with automated ETL re-indexing.
              </p>
            </div>
            {editingCode !== null && (
              <button
                onClick={resetForm}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSaveStore} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                AdmSite Code (Integer ID)
              </label>
              <input
                type="number"
                placeholder="e.g. 950"
                value={admsiteCode}
                onChange={(e) => setAdmsiteCode(e.target.value)}
                disabled={editingCode !== null}
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Store / Location Name
              </label>
              <input
                type="text"
                placeholder="e.g. M Baazar - Howrah Outlet"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Site Designation
              </label>
              <div className="flex gap-2">
                <select
                  value={siteType}
                  onChange={(e) => setSiteType(e.target.value)}
                  className="flex-1 h-10 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="RETAIL_STORE">RETAIL_STORE</option>
                  <option value="CENTRAL_WAREHOUSE">CENTRAL_WAREHOUSE</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 h-10 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50 shrink-0"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingCode !== null
                    ? "Update Store"
                    : "Save Store Data"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900 shadow-xs">
        <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Managed Store Outlets (<span className="text-brand-600 dark:text-brand-400">{filteredLocations.length}</span>)
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Real-time store directory scalable up to 250+ locations.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search by store name or AdmSite ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-72 h-9 px-3 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        {isLoadingLocations ? (
          <div className="h-40 w-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
        ) : (
          <div className="overflow-x-auto outline-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>admSite_code</TableCell>
                  <TableCell isHeader>Store / Location Name</TableCell>
                  <TableCell isHeader>Site Type</TableCell>
                  <TableCell isHeader>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((cell) => (
                  <TableRow key={cell.admsite_code}>
                    <TableCell className="font-mono font-bold text-brand-600 dark:text-brand-400">
                      #{cell.admsite_code}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">
                      {cell.name}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          cell.site_type === "CENTRAL_WAREHOUSE" || cell.admsite_code === 1070
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {cell.site_type || "RETAIL_STORE"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(cell)}
                          className="px-2.5 py-1 text-xs font-semibold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cell.admsite_code, cell.name)}
                          className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
