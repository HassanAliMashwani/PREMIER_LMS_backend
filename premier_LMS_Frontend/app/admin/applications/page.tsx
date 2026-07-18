"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Application {
  id: string;
  fullName: string;
  cnic: string;
  email: string;
  whatsapp: string;
  selectedCourses: string[];
  totalAmount: number;
  status: string;
  paymentProof?: string;
  cnicFile?: string;
  photoFile?: string;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get("/admissions");
      setApplications(res.data);
    } catch (err) {
      console.error("Failed to fetch applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/admissions/${selectedApp.id}/status`, {
        status,
        remarks,
      });
      setActionLoading(false);

      if (res.data?.generatedPassword) {
        setNewCredentials({
          email: res.data.user.email,
          password: res.data.generatedPassword,
        });
        navigator.clipboard.writeText(`Email: ${res.data.user.email}\nPassword: ${res.data.generatedPassword}`).catch(() => {});
        showToast("Application approved! Credentials copied to clipboard.");
      } else {
        showToast(`Application marked as ${status}`);
      }
      setSelectedApp(null);
      setRemarks("");
      await fetchApplications();
    } catch (err: any) {
      setActionLoading(false);
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  const getMediaUrl = (path: string) => {
    if (!path) return "#";
    // Check if absolute or relative
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/^\.?\//, "");
    return `${api.defaults.baseURL}/uploads/${cleanPath}`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-text-primary">Admissions Applications</h1>
        <p className="text-xs text-text-secondary mt-1">Review student applications and verify payment proofs</p>
      </div>

      {newCredentials && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start justify-between gap-4 animate-fade-in">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600 font-bold">✓</div>
            <div>
              <h4 className="text-sm font-bold text-green-800">Student Account Created Successfully</h4>
              <p className="text-xs text-green-700 mt-1">Share these credentials with the student (already copied to clipboard):</p>
              <div className="mt-2 text-xs font-mono bg-white border border-green-200 rounded-lg p-2.5 space-y-1 text-text-primary select-all">
                <p><strong>Email:</strong> {newCredentials.email}</p>
                <p><strong>Password:</strong> {newCredentials.password}</p>
              </div>
            </div>
          </div>
          <button onClick={() => setNewCredentials(null)} className="text-green-500 hover:text-green-700 font-bold text-xs shrink-0">✕ Dismiss</button>
        </div>
      )}

      <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-light border-b border-border-light">
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Full Name</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">CNIC</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">WhatsApp</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Selected Courses</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-bg-light transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-text-primary">
                    <div>
                      <span>{app.fullName}</span>
                      <span className="text-[10px] text-text-secondary block font-normal">{app.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-text-secondary">{app.cnic}</td>
                  <td className="px-6 py-4 text-xs text-text-secondary">{app.whatsapp}</td>
                  <td className="px-6 py-4 text-xs text-text-primary">
                    {app.selectedCourses.join(", ")}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      app.status === "approved"
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : app.status === "rejected"
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-yellow-50 text-yellow-600 border border-yellow-200"
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-right">
                    <button onClick={() => setSelectedApp(app)} className="btn-signup text-[10px] px-3 py-1 bg-white border border-border-light text-text-primary hover:bg-bg-light">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-text-secondary">
                    No applications submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white border border-border-light rounded-xl p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b border-border-light pb-3">
              <h2 className="font-bold text-text-primary text-base">Review Application</h2>
              <button onClick={() => setSelectedApp(null)} className="text-text-secondary hover:text-text-primary text-xl font-bold">×</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase text-text-secondary tracking-wider">Personal Info</h3>
                <p><strong>Name:</strong> {selectedApp.fullName}</p>
                <p><strong>CNIC:</strong> {selectedApp.cnic}</p>
                <p><strong>Email:</strong> {selectedApp.email}</p>
                <p><strong>WhatsApp:</strong> {selectedApp.whatsapp}</p>
                <p><strong>Selected Courses:</strong> {selectedApp.selectedCourses.join(", ")}</p>
                <p><strong>Total Paid amount:</strong> PKR {selectedApp.totalAmount.toLocaleString()}</p>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase text-text-secondary tracking-wider">Attached Documents</h3>
                <div className="flex flex-col gap-2">
                  {selectedApp.paymentProof && (
                    <a href={getMediaUrl(selectedApp.paymentProof)} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green hover:underline">
                      📎 View Payment Proof Receipt
                    </a>
                  )}
                  {selectedApp.cnicFile && (
                    <a href={getMediaUrl(selectedApp.cnicFile)} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green hover:underline">
                      📎 View CNIC Copy
                    </a>
                  )}
                  {selectedApp.photoFile && (
                    <a href={getMediaUrl(selectedApp.photoFile)} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green hover:underline">
                      📎 View Photo
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border-light pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Remarks / Reason</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" rows={3} placeholder="Add remarks for approval / rejection" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => handleUpdateStatus("rejected")} className="btn-signup bg-red-600 border-red-600 hover:bg-red-700 text-xs px-4 py-2">
                  Reject Application
                </button>
                <button onClick={() => handleUpdateStatus("approved")} className="btn-signup bg-green-600 border-green-600 hover:bg-green-700 text-xs px-4 py-2">
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/25 backdrop-blur-[2px]">
          <div className="bg-white border border-border-light rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-2xl">
            <div className="w-10 h-10 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Processing Request...</p>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[99999] flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-lg border animate-scale-up max-w-sm ${
          toast.type === "success"
            ? "bg-[#edf7f3] border-green-200 text-green-800"
            : "bg-[#fdf2f2] border-red-200 text-red-800"
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
            toast.type === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}>
            {toast.type === "success" ? "✓" : "!"}
          </div>
          <p className="text-xs font-bold leading-normal">{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 text-sm ml-2 font-bold">✕</button>
        </div>
      )}
    </div>
  );
}
