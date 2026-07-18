"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useModal } from "@/lib/ModalContext";

interface Course {
  id: string;
  name: string;
}

interface Enrollment {
  id: string;
  courseId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Batch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status?: string;
  classesPerWeek: number;
  thumbnail?: string;
  courses: Course[];
  enrollments?: Enrollment[];
}

export default function AdminBatchesPage() {
  const { showAlert, showConfirm } = useModal();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    courseIds: [] as string[],
    thumbnail: "",
    classesPerWeek: 3,
  });

  const fetchBatches = async () => {
    try {
      const res = await api.get("/batches");
      setBatches(res.data);
    } catch (err) {
      console.error("Failed to load batches", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    api.get("/courses/all")
      .then((res) => setCoursesList(res.data))
      .catch(() => {});
  }, []);

  const handleCourseToggle = (courseId: string) => {
    if (form.courseIds.includes(courseId)) {
      setForm({ ...form, courseIds: form.courseIds.filter((id) => id !== courseId) });
    } else {
      setForm({ ...form, courseIds: [...form.courseIds, courseId] });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setActionLoading(true);
    try {
      const res = await api.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm({ ...form, thumbnail: res.data.filename });
      showAlert("Success", "Thumbnail uploaded successfully!");
    } catch (err: any) {
      showAlert("Error", err.response?.data?.message || "File upload failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      showAlert("Required Fields", "Please fill in all required fields.");
      return;
    }

    setActionLoading(true);
    try {
      await api.post("/batches", form);
      setShowModal(false);
      setForm({ name: "", startDate: "", endDate: "", courseIds: [], thumbnail: "", classesPerWeek: 3 });
      await fetchBatches();
    } catch (err: any) {
      showAlert("Error", err.response?.data?.message || "Failed to create batch");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/batches/${id}`, { status: newStatus });
      await fetchBatches();
    } catch (err: any) {
      showAlert("Error", err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Delete Batch", "Are you sure you want to delete this batch?");
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await api.delete(`/batches/${id}`);
      await fetchBatches();
    } catch {
      showAlert("Error", "Failed to delete batch");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  const getMediaUrl = (path?: string) => {
    if (!path) return "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop";
    if (path.startsWith("http")) return path;
    const cleanPath = path.replace(/^\.?\//, "");
    return `${api.defaults.baseURL}/uploads/${cleanPath}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Batches</h1>
          <p className="text-xs text-text-secondary mt-1">Manage academic batches and offered courses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-signup text-xs px-4 py-2">
          + Add Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.map((batch) => (
          <div key={batch.id} className="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="relative w-full aspect-[21/9] bg-bg-light">
              <img src={getMediaUrl(batch.thumbnail)} alt={batch.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3">
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  batch.status === "admission"
                    ? "bg-emerald-500 text-white"
                    : batch.status === "classes"
                    ? "bg-blue-600 text-white"
                    : batch.status === "completed"
                    ? "bg-gray-500 text-white"
                    : batch.isActive
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-text-secondary"
                }`}>
                  {batch.status === "admission"
                    ? "Admission Phase"
                    : batch.status === "classes"
                    ? "Classes Phase"
                    : batch.status === "completed"
                    ? "Completed"
                    : batch.isActive
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">{batch.name}</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Start: {new Date(batch.startDate).toLocaleDateString()} • End: {new Date(batch.endDate).toLocaleDateString()}
                </p>
                <p className="text-[11px] font-bold text-brand-green bg-brand-green/5 border border-brand-green/10 rounded-md px-2 py-0.5 mt-2 inline-block">
                  Weekly Target: {batch.classesPerWeek || 3} Classes
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5">Offered Courses &amp; Enrolled Students:</h4>
                <div className="space-y-3">
                  {batch.courses.map((course) => {
                    const courseEnrollments = batch.enrollments?.filter(
                      (e: any) => e.courseId === course.id
                    ) || [];
                    const emails = courseEnrollments.map((e: any) => e.user?.email).filter(Boolean);

                    return (
                      <div key={course.id} className="bg-bg-light border border-border-light rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold text-text-primary">
                            {course.name}
                          </span>
                          <span className="text-[10px] font-bold text-text-secondary uppercase bg-white border border-border-light px-2 py-0.5 rounded">
                            {courseEnrollments.length} Student{courseEnrollments.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {courseEnrollments.length > 0 && (
                          <div className="mt-3.5 space-y-2 border-t border-border-light pt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-text-secondary uppercase">Students List</span>
                              <button
                                onClick={() => {
                                  const emailString = emails.join(", ");
                                  navigator.clipboard.writeText(emailString);
                                  showAlert("Emails Copied", `Copied ${emails.length} email addresses to clipboard.`);
                                }}
                                className="text-[10px] font-bold text-brand-green hover:underline cursor-pointer inline-flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy Emails
                              </button>
                            </div>

                            <div className="max-h-24 overflow-y-auto pr-1 text-[11px] space-y-1.5 custom-scrollbar">
                              {courseEnrollments.map((e: any) => (
                                <div key={e.id} className="flex justify-between items-center text-text-secondary gap-4">
                                  <span className="font-semibold truncate max-w-[140px]">{e.user?.name}</span>
                                  <span className="font-mono text-gray-500 truncate">{e.user?.email}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {courseEnrollments.length === 0 && (
                          <div className="text-[10px] text-text-secondary italic mt-1 bg-white border border-border-light/50 px-2 py-1 rounded">
                            No students enrolled yet
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {batch.courses.length === 0 && (
                    <p className="text-xs text-text-secondary italic">No courses assigned to this batch</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-between items-center border-t border-border-light pt-4 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-text-secondary">Status:</span>
                  <select
                    value={batch.status || (batch.isActive ? "classes" : "completed")}
                    onChange={(e) => handleStatusChange(batch.id, e.target.value)}
                    className="px-2 py-1.5 text-xs border border-border-light rounded-lg bg-white text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-brand-green cursor-pointer shadow-sm hover:border-text-secondary transition-colors"
                  >
                    <option value="admission">Admission Phase</option>
                    <option value="classes">Classes Phase</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <button onClick={() => handleDelete(batch.id)} className="text-red-500 hover:text-red-700 text-xs px-3 py-1.5 font-bold transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {batches.length === 0 && (
          <div className="col-span-2 bg-white border border-border-light rounded-xl p-12 text-center text-text-secondary text-sm">
            No batches created yet.
          </div>
        )}
      </div>

      {/* Add Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white border border-border-light rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b border-border-light pb-3">
              <h2 className="font-bold text-text-primary text-base">Add New Batch</h2>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary text-xl font-bold">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Batch Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" placeholder="e.g. Income Tax Filing Masterclass — July 2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Classes per Week</label>
                  <input type="number" min={1} max={7} value={form.classesPerWeek} onChange={(e) => setForm({ ...form, classesPerWeek: parseInt(e.target.value) || 3 })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Batch Banner / Thumbnail</label>
                  <input type="file" onChange={handleFileUpload} className="w-full text-xs text-text-secondary mt-1.5" />
                  {form.thumbnail && <span className="text-[10px] text-green-600 block mt-1">✓ Banner uploaded</span>}
                </div>
              </div>


              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Offered Courses</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border-light rounded-lg p-3 bg-bg-light">
                  {coursesList.map((course) => (
                    <label key={course.id} className="flex items-center gap-2 text-xs font-medium text-text-primary cursor-pointer hover:text-brand-green">
                      <input type="checkbox" checked={form.courseIds.includes(course.id)} onChange={() => handleCourseToggle(course.id)} />
                      {course.name}
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={handleCreate} className="btn-signup w-full py-2.5 text-sm mt-4">Create Batch</button>
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
    </div>
  );
}
