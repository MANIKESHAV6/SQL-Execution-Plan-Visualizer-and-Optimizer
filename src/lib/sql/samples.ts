export interface SampleQuery {
  name: string;
  sql: string;
}

export const SAMPLE_QUERIES: SampleQuery[] = [
  {
    name: "Simple filter",
    sql: `SELECT name, age
FROM students
WHERE age > 18
ORDER BY name;`,
  },
  {
    name: "Select * (anti-pattern)",
    sql: `SELECT *
FROM orders
WHERE total > 100;`,
  },
  {
    name: "Join + filter",
    sql: `SELECT students.name, courses.title
FROM students
INNER JOIN enrollments ON enrollments.student_id = students.id
INNER JOIN courses ON courses.id = enrollments.course_id
WHERE students.age > 20;`,
  },
  {
    name: "Group by",
    sql: `SELECT department, COUNT(id)
FROM employees
WHERE active = 1
GROUP BY department
ORDER BY department;`,
  },
  {
    name: "Sort without filter",
    sql: `SELECT title
FROM books
ORDER BY published_at;`,
  },
];
