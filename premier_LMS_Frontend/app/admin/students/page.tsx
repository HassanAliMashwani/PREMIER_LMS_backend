"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useModal } from "@/lib/ModalContext";

interface Student {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  enrollments: {
    id: string;
    course: {
      name: string;
    };
  }[];
}

export default function AdminStudentsPage() {
  const { showAlert } = useModal();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users?role=student");
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to load students list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleToggleStatus = async (id: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/users/${id}/toggle-active`);
      await fetchStudents();
    } catch {
      showAlert("Error", "Failed to toggle status");
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
      <div className="mb-8">
        <h1 className="text-xl font-bold text-text-primary">Enrolled Students</h1>
        <p className="text-xs text-text-secondary mt-1">Manage active students and their courses</p>
      </div>

      <div className="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-light border-b border-border-light">
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Student Name</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Enrolled Courses</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-bg-light transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-text-primary">{student.name}</td>
                  <td className="px-6 py-4 text-xs text-text-secondary">{student.email}</td>
                  <td className="px-6 py-4 text-xs text-text-primary">
                    {student.enrollments?.map((e) => e.course.name).join(", ") || "None"}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      student.isActive ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-100 text-text-secondary"
                    }`}>
                      {student.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-right">
                    <button onClick={() => handleToggleStatus(student.id)} className="btn-signup text-[10px] px-3 py-1 bg-white border border-border-light text-text-primary hover:bg-bg-light">
                      Toggle Active
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-text-secondary">
                    No active students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
