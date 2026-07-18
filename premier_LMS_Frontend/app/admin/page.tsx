"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    applications: 0,
    students: 0,
    courses: 0,
    classes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [appRes, studentRes, courseRes, classRes] = await Promise.all([
          api.get("/admissions"),
          api.get("/users?role=student"),
          api.get("/courses/all"),
          api.get("/classes/count/upcoming"),
        ]);
        setStats({
          applications: appRes.data.length,
          students: studentRes.data.length,
          courses: courseRes.data.length,
          classes: typeof classRes.data === "number" ? classRes.data : classRes.data.count || 0,
        });
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Applications", value: stats.applications },
    { label: "Active Students", value: stats.students },
    { label: "Total Courses", value: stats.courses },
    { label: "Upcoming Classes", value: stats.classes },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-xs text-text-secondary mt-1">Academy overview and statistics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-border-light rounded-xl p-6 shadow-sm">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{card.label}</p>
            <p className="text-3xl font-extrabold text-text-primary mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
