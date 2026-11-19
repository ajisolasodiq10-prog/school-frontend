import { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle.js";
import PageTitle from "../../student-portal/components/PageTitle.jsx";
import EmptyState from "../../student-portal/components/EmptyState.jsx";
import Button from "../../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import { useTeacherData } from "../context/TeacherDataContext.jsx";

export default function MyStudents() {
  usePageTitle("My Students");
  const { classes, students } = useTeacherData();
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("all");

  const query = search.trim().toLowerCase();
  const visible = students.filter(
    (s) =>
      (classId === "all" || s.classId === classId) &&
      (!query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query))
  );
  const classOf = (id) => classes.find((c) => c.id === id);

  const clearFilters = () => {
    setSearch("");
    setClassId("all");
  };

  return (
    <>
      <PageTitle
        title="My Students"
        description="Students in the classes assigned to you. These are fictional students."
      />

      <div className="tp-filters">
        <FormField
          id="student-search"
          label="Search by name or ID"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FormField
          id="student-class"
          label="Class"
          as="select"
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          options={[{ value: "all", label: "All my classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
        />
      </div>

      <p className="tp-count" role="status">
        Showing {visible.length} of {students.length} students
      </p>

      {visible.length === 0 ? (
        <EmptyState title="No students found">
          <p>No student matches your search or class filter.</p>
          <Button variant="outline" size="small" onClick={clearFilters}>
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <div className="sp-table-wrap" role="region" aria-label="Student list" tabIndex={0}>
          <table className="sp-table tp-stack-table">
            <caption className="visually-hidden">Students in your assigned classes</caption>
            <thead>
              <tr>
                <th scope="col">Student ID</th>
                <th scope="col">Student name</th>
                <th scope="col">Class and arm</th>
                <th scope="col">Subject</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((student) => {
                const item = classOf(student.classId);
                return (
                  <tr key={student.id}>
                    <td data-label="Student ID">{student.id}</td>
                    <th scope="row" data-label="Name">{student.name}</th>
                    <td data-label="Class and arm">{item.level}, Arm {item.arm}</td>
                    <td data-label="Subject">{item.subjects.join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
