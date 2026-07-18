"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useModal } from "@/lib/ModalContext";

interface Course {
  id: string;
  name: string;
  originalFee: number;
  discountedFee: number;
  isActive: boolean;
}

export default function AdminCoursesPage() {
  const { showAlert } = useModal();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    originalFee: 50000,
    discountedFee: 30000,
  });

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/all");
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to load courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async () => {
    setActionLoading(true);
    try {
      await api.post("/courses", form);
      setShowModal(false);
      setForm({ name: "", originalFee: 50000, discountedFee: 30000 });
      await fetchCourses();
    } catch (err: any) {
      showAlert("Error", err.response?.data?.message || "Failed to create course");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/courses/${id}`);
      await fetchCourses();
    } catch {
      showAlert("Error", "Failed to toggle course status");
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Courses</h1>
          <p className="text-xs text-text-secondary mt-1">Manage academy curriculum and fees</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-signup text-xs px-4 py-2">
          + Add Course
        </button>
      </div>

      <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-light border-b border-border-light">
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Course Name</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Original Fee (PKR)</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Discounted Fee (PKR)</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-bg-light transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-text-primary">{course.name}</td>
                  <td className="px-6 py-4 text-xs text-text-secondary">{course.originalFee.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs text-text-secondary">{course.discountedFee.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      course.isActive ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-100 text-text-secondary"
                    }`}>
                      {course.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/courses/${course.id}`} className="btn-signup text-[10px] px-3 py-1 bg-brand-green text-white hover:bg-brand-green-dark no-underline inline-block">
                        Edit Details
                      </Link>
                      <button onClick={() => handleToggleActive(course.id)} className="btn-signup text-[10px] px-3 py-1 bg-white border border-border-light text-text-primary hover:bg-bg-light">
                        Toggle Active
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-text-secondary">
                    No courses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-border-light rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-text-primary text-base">Add New Course</h2>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary text-xl font-bold">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Course Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" placeholder="e.g. Certified Tax Practitioner (CTP)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Original Fee</label>
                  <input type="number" value={form.originalFee} onChange={(e) => setForm({ ...form, originalFee: Number(e.target.value) })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Discounted Fee</label>
                  <input type="number" value={form.discountedFee} onChange={(e) => setForm({ ...form, discountedFee: Number(e.target.value) })} className="w-full px-4 py-2 text-sm border border-border-light rounded-lg bg-white text-text-primary" />
                </div>
              </div>
              <button onClick={handleCreate} className="btn-signup w-full py-2.5 text-sm">Add Course</button>
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
